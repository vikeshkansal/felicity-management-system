import express from "express";
import crypto from "crypto";
import QRCode from "qrcode";
import sessionMiddleware from "../middleware/session.middleware.js";
import Registration from "../models/registrations.models.js";
import Event from "../models/events.models.js";
import Participant from "../models/participants.models.js";
import { sendRegistrationEmail } from "../utils/email.js";

const registrationRouter = express.Router();

registrationRouter.post("/:id", sessionMiddleware(["participant"]), async (req, res): Promise<void> => {
    try {
        const eventID = req.params.id as string;
        const participantID = res.locals.user.userId;
        const { customFormResponses, merchandiseSelection } = req.body || {};

        if (!eventID || !participantID) {
            res.status(400).json({ message: "All fields are required" });
            return;
        }

        const event = await Event.findById(eventID);
        if (!event) {
            res.status(404).json({ message: "Event not found" });
            return;
        }

        if (event.status !== "published") {
            res.status(400).json({ message: "Registrations are closed for this event" });
            return;
        }

        const participant = await Participant.findById(participantID).select("participantType email name");
        if (!participant) {
            res.status(404).json({ message: "Participant not found" });
            return;
        }

        if (event.eligibility !== "All" && event.eligibility !== participant.participantType) {
            res.status(403).json({ message: "You are not eligible to register for this event" });
            return;
        }

        const now = new Date();
        if (now > event.regDeadline) {
            res.status(400).json({ message: "Registration deadline passed" });
            return;
        }

        const count = await Registration.countDocuments({ event: eventID });
        const normalizedCustomResponses: Array<{ fieldName: string; value: string | boolean }> = [];
        let normalizedMerchSelection: { size: string; variant: string; color?: string } | undefined;

        if (event.type === "merchandise") {
            const effectiveLimit = event.stockQuantity > 0 ? Math.min(event.regLimit, event.stockQuantity) : event.regLimit;
            if (count >= effectiveLimit) {
                res.status(400).json({ message: "Event is full / out of stock", count });
                return;
            }
            const participantPurchases = await Registration.countDocuments({ event: eventID, participant: participantID });
            if (participantPurchases >= event.purchaseLimitPerParticipant) {
                res.status(400).json({ message: `Purchase limit of ${event.purchaseLimitPerParticipant} reached` });
                return;
            }

            const availableSizes = event.itemDetails?.sizes || [];
            const availableColors = event.itemDetails?.colors || [];
            const availableVariants = event.itemDetails?.variants || [];

            if (!merchandiseSelection || typeof merchandiseSelection !== "object") {
                res.status(400).json({ message: "Merchandise selection is required" });
                return;
            }

            const { size, color, variant } = merchandiseSelection as { size?: string; color?: string; variant?: string };

            if (!size || (availableSizes.length > 0 && !availableSizes.includes(size))) {
                res.status(400).json({ message: "Please select a valid size" });
                return;
            }

            if (!variant || (availableVariants.length > 0 && !availableVariants.includes(variant))) {
                res.status(400).json({ message: "Please select a valid variant" });
                return;
            }

            if (color && availableColors.length > 0 && !availableColors.includes(color)) {
                res.status(400).json({ message: "Please select a valid color" });
                return;
            }

            normalizedMerchSelection = { size, variant, ...(color ? { color } : {}) };
        } else {
            if (count >= event.regLimit) {
                res.status(400).json({ message: "Event is full", count });
                return;
            }
            const existingRegistration = await Registration.findOne({ event: eventID, participant: participantID });
            if (existingRegistration) {
                res.status(409).json({ message: "Already registered for this event" });
                return;
            }

            const configuredFields = event.customForm || [];
            const incomingResponses = Array.isArray(customFormResponses) ? customFormResponses : [];
            const responseMap = new Map<string, string | boolean>();

            incomingResponses.forEach((response) => {
                if (
                    response &&
                    typeof response === "object" &&
                    typeof response.fieldName === "string" &&
                    (typeof response.value === "string" || typeof response.value === "boolean")
                ) {
                    responseMap.set(response.fieldName, response.value);
                }
            });

            for (const field of configuredFields) {
                const value = responseMap.get(field.fieldName);

                if (field.required) {
                    if (field.fieldType === "checkbox") {
                        if (value !== true) {
                            res.status(400).json({ message: `${field.fieldName} is required` });
                            return;
                        }
                    } else {
                        if (typeof value !== "string" || value.trim() === "") {
                            res.status(400).json({ message: `${field.fieldName} is required` });
                            return;
                        }
                    }
                }

                if (value === undefined) {
                    continue;
                }

                if (field.fieldType === "dropdown") {
                    if (typeof value !== "string" || !field.options.includes(value)) {
                        res.status(400).json({ message: `Invalid option selected for ${field.fieldName}` });
                        return;
                    }
                }

                if (field.fieldType === "checkbox" && typeof value !== "boolean") {
                    res.status(400).json({ message: `${field.fieldName} must be true or false` });
                    return;
                }

                if ((field.fieldType === "text" || field.fieldType === "file") && typeof value !== "string") {
                    res.status(400).json({ message: `${field.fieldName} must be a valid text value` });
                    return;
                }

                normalizedCustomResponses.push({ fieldName: field.fieldName, value });
            }
        }
        const uuid = crypto.randomUUID();
        const ticketPayload = JSON.stringify({
            ticketId: uuid,
            eventId: eventID,
            participantId: participantID,
            type: event.type === "merchandise" ? "purchase" : "registration"
        });
        const ticketQrCode = await QRCode.toDataURL(ticketPayload);

        const registration = new Registration({
            event: eventID,
            participant: participantID,
            ticketId: uuid,
            ticketQrCode,
            customFormResponses: normalizedCustomResponses,
            merchandiseSelection: normalizedMerchSelection
        });
        await registration.save();

        const participantName = participant.name
            ? `${participant.name.firstName} ${participant.name.lastName}`.trim()
            : undefined;

        await sendRegistrationEmail(
            participant.email,
            event.name,
            uuid,
            event.start ? new Date(event.start).toLocaleString() : undefined,
            participantName
        );

        res.status(201).json({
            message: event.type === "merchandise" ? "Purchase created successfully" : "Registration created successfully",
            ticketId: uuid,
            ticketQrCode,
            count: count + 1
        });

    } catch (error) {
        console.error("Error creating registration: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

registrationRouter.get("/my-registrations", sessionMiddleware(["participant"]), async (req, res): Promise<void> => {
    try {
        const participantID = res.locals.user.userId;
        const registrations = await Registration.find({ participant: participantID }).populate("event");
        res.status(200).json(registrations);
    } catch (error) {
        console.error("Error fetching registrations: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

registrationRouter.get("/event/:id", sessionMiddleware(["organizer", "admin"]), async (req, res): Promise<void> => {
    try {
        const eventID = req.params.id as string;
        const userID = res.locals.user.userId;
        const event = await Event.findById(eventID);
        if (!event) {
            res.status(404).json({ message: "Event not found" });
            return;
        }
        if (res.locals.user.role !== "admin" && event.organizer.toString() !== userID) {
            res.status(403).json({ message: "Unauthorized" });
            return;
        }
        const registrations = await Registration.find({ event: eventID as string }).populate("participant");
        res.status(200).json(registrations);
    } catch (error) {
        console.error("Error fetching registrations: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default registrationRouter;