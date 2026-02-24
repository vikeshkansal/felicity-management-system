import Event from "../models/events.models.js";
import express from "express";
import sessionMiddleware from "../middleware/session.middleware.js";
import Registration from "../models/registrations.models.js";
import Organizer from "../models/organizers.models.js";
import eventSchema from "../schemas/events.schemas.js";

const eventRouter = express.Router();

eventRouter.get("/trending", async (req, res): Promise<void> => {
    try {
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        const trendingEvents = await Registration.aggregate([
            { $match: { createdAt: { $gte: oneDayAgo } } },
            { $group: { _id: "$event", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
            { $lookup: { from: "events", localField: "_id", foreignField: "_id", as: "event" } },
            { $unwind: "$event" },
            { $project: { _id: 0, event: 1, registrationCount24h: "$count" } }
        ]);
        const events = trendingEvents.map(item => ({ ...item.event, trendingCount: item.registrationCount24h }));
        res.status(200).json(events);
    } catch (error) {
        console.error("Error fetching trending events: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

eventRouter.get("/", sessionMiddleware(["admin", "organizer", "participant"]), async (req, res): Promise<void> => {
    try {
        const { search, eligibility, type, status, start, end, organizerIds } = req.query;
        if (status && !['draft', 'published', 'closed', 'ongoing', 'completed'].includes(status as string)) {
            res.status(400).json({ message: "Invalid status" });
            return;
        }
        if (type && !['normal', 'merchandise'].includes(type as string)) {
            res.status(400).json({ message: "Invalid type" });
            return;
        }
        if (start && isNaN(Date.parse(start as string))) { res.status(400).json({ message: "Invalid start date" }); return; }
        if (end && isNaN(Date.parse(end as string))) { res.status(400).json({ message: "Invalid end date" }); return; }

        let query: any = {};

        const user = res.locals.user;
        const userId = user?.userId;
        const userRole = user?.role;

        if (status === 'draft') {
            if (!userId) {
                res.status(401).json({ message: "Authentication required to view drafts" });
                return;
            }
            if (userRole === 'admin') {
                query.status = 'draft';
            } else if (userRole === 'organizer') {
                query.status = 'draft';
                query.organizer = userId;
            } else {
                res.status(403).json({ message: "Participants cannot view drafts" });
                return;
            }
        } else {
            if (status) {
                query.status = status;
            } else {
                query.status = { $ne: 'draft' };
            }
        }

        if (eligibility && !['IIIT-H', 'External', 'All'].includes(eligibility as string)) {
            res.status(400).json({ message: "Invalid eligibility" });
            return;
        }
        if (eligibility) {
            if (eligibility === 'All') {
                query.eligibility = 'All';
            } else {
                query.eligibility = { $in: [eligibility, 'All'] };
            }
        }
        if (type) query.type = type;

        if (search) {
            const searchString = search as string;
            const matchingOrganizers = await Organizer.find({ name: { $regex: searchString, $options: "i" } }).select("_id");
            const orgIds = matchingOrganizers.map(org => org._id);
            query.$or = [
                { name: { $regex: searchString, $options: "i" } },
                { description: { $regex: searchString, $options: "i" } },
                { organizer: { $in: orgIds } }
            ];
        }

        if (start || end) {
            query.start = {};
            if (start) query.start.$gte = new Date(start as string);
            if (end) query.start.$lte = new Date(end as string);
        }

        if (organizerIds) {
            const ids = typeof organizerIds === 'string' ? organizerIds.split(',') : organizerIds;
            if (query.organizer) {
                const requestedIds = Array.isArray(ids) ? ids : [ids];
                if (!requestedIds.includes(query.organizer)) {
                    query.organizer = { $in: [] };
                }
            } else {
                query.organizer = { $in: ids };
            }
        }

        const events = await Event.find(query).populate("organizer", "name");
        res.status(200).json(events);

    } catch (error) {
        console.error("Error fetching events: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

eventRouter.get("/:id", sessionMiddleware(["participant", "organizer", "admin"]), async (req, res): Promise<void> => {
    try {
        const event = await Event.findById(req.params.id).populate("organizer", "name");
        if (!event) {
            res.status(404).json({ message: "Event not found" });
            return;
        }
        res.status(200).json(event);
    } catch (error) {
        console.error("Error fetching event: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

eventRouter.post("/create", sessionMiddleware(["organizer", "admin"]), async (req, res): Promise<void> => {
    try {
        const organizerid = res.locals.user.userId;
        const payload = { ...req.body, organizer: organizerid };

        const parsed = eventSchema.safeParse(payload);
        if (!parsed.success) {
            const fieldErrors = parsed.error.flatten().fieldErrors;
            const firstFieldError = Object.values(fieldErrors).flat().find(Boolean);
            res.status(400).json({
                message: firstFieldError || "Validation failed",
                errors: fieldErrors
            });
            return;
        }

        const data = parsed.data;

        const startDate = new Date(data.start);
        const endDate = new Date(data.end);
        const deadlineDate = new Date(data.regDeadline);

        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || Number.isNaN(deadlineDate.getTime())) {
            res.status(400).json({ message: "Invalid date values" });
            return;
        }

        if (startDate < new Date()) {
            res.status(400).json({ message: "Event start date cannot be in the past" });
            return;
        }

        if (endDate <= startDate) {
            res.status(400).json({ message: "Event end date must be after start date" });
            return;
        }

        if (deadlineDate > startDate) {
            res.status(400).json({ message: "Registration deadline must be on/before event start" });
            return;
        }

        if (data.regLimit <= 0 || data.regFee < 0) {
            res.status(400).json({ message: "regLimit must be > 0 and regFee must be >= 0" });
            return;
        }

        const eventData: any = {
            name: data.name, description: data.description, type: data.type,
            eligibility: data.eligibility, regDeadline: data.regDeadline,
            regLimit: data.regLimit, regFee: data.regFee, tags: data.tags,
            start: data.start, end: data.end, organizer: organizerid, status: data.status
        };

        if (data.type === "merchandise") {
            eventData.itemDetails = data.itemDetails;
            eventData.stockQuantity = data.stockQuantity;
            eventData.purchaseLimitPerParticipant = data.purchaseLimitPerParticipant;
        } else {
            eventData.customForm = data.customForm;
        }
        const event = new Event(eventData);
        await event.save();
        res.status(201).json({ message: "Event created successfully", eventId: event._id, event });
    } catch (error) {
        console.error("Error creating event: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


eventRouter.put("/:id", sessionMiddleware(["organizer", "admin"]), async (req, res): Promise<void> => {
    try {
        const eventID = req.params.id;
        if (typeof eventID !== "string") {
            res.status(400).json({ message: "Invalid event id" });
            return;
        }
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

        const updates = req.body;
        const hasRegistrations = await Registration.exists({ event: eventID });

        if (hasRegistrations) {
            const structuralFields = ["type", "customForm", "itemDetails", "stockQuantity", "purchaseLimitPerParticipant", "organizer", "_id"];
            const touchedStructuralField = structuralFields.some((field) => Object.prototype.hasOwnProperty.call(updates, field));
            if (touchedStructuralField) {
                res.status(409).json({ message: "Cannot modify structural fields after registrations exist" });
                return;
            }
        }

        if (updates.status && updates.status !== event.status) {
            const allowedTransitions: Record<string, string[]> = {
                'draft': ['published'],
                'published': ['ongoing', 'closed'],
                'ongoing': ['completed', 'closed'],
                'closed': ['ongoing'],
                'completed': [],
            };
            const allowed = allowedTransitions[event.status] || [];
            if (!allowed.includes(updates.status) && res.locals.user.role !== 'admin') {
                res.status(400).json({ message: `Invalid status transition from ${event.status} to ${updates.status}` });
                return;
            }
        }

        if (event.status === 'draft') {
            const { organizer, _id, ...safeUpdates } = updates;
            Object.assign(event, safeUpdates);
        } else if (event.status === 'published' || event.status === 'ongoing') {
            if (updates.description !== undefined) event.description = updates.description;
            if (updates.regDeadline !== undefined) event.regDeadline = updates.regDeadline;
            if (updates.regLimit !== undefined) event.regLimit = updates.regLimit;
            if (updates.status !== undefined) event.status = updates.status;
            if (updates.tags !== undefined) event.tags = updates.tags;
            if (updates.start !== undefined) event.start = updates.start;
            if (updates.end !== undefined) event.end = updates.end;
            if (
                Object.prototype.hasOwnProperty.call(updates, "type") ||
                Object.prototype.hasOwnProperty.call(updates, "customForm") ||
                Object.prototype.hasOwnProperty.call(updates, "itemDetails") ||
                Object.prototype.hasOwnProperty.call(updates, "stockQuantity") ||
                Object.prototype.hasOwnProperty.call(updates, "purchaseLimitPerParticipant")
            ) {
                res.status(400).json({ message: "Cannot change structural fields of published or ongoing events" });
                return;
            }
        } else {
            if (updates.status) event.status = updates.status;
        }

        await event.save();
        res.status(200).json({ message: "Event updated successfully", event });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

eventRouter.delete("/:id", sessionMiddleware(["organizer", "admin"]), async (req, res): Promise<void> => {
    try {
        const eventID = req.params.id;
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
        await event.deleteOne();
        res.status(200).json({ message: "Event deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default eventRouter;