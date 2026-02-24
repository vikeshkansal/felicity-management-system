import express from "express";
import bcrypt from "bcrypt";
import Organizer from "../models/organizers.models.js";
import sessionMiddleware from "../middleware/session.middleware.js";
import organizerSchema from "../schemas/organizers.schemas.js";
import Event from "../models/events.models.js";
import Participant from "../models/participants.models.js";

const adminRouter = express.Router();

adminRouter.get("/dashboard", sessionMiddleware(["admin"]), async (req, res): Promise<void> => {
    try {
        const totalOrganizers = await Organizer.countDocuments();
        const totalEvents = await Event.countDocuments();
        const totalParticipants = await Participant.countDocuments();
        const activeOrganizers = await Organizer.countDocuments({ isDisabled: false });
        res.status(200).json({ totalOrganizers, totalEvents, totalParticipants, activeOrganizers });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

adminRouter.post("/add-organizer", sessionMiddleware(["admin"]), async (req, res): Promise<void> => {
    try {
        const validatedData = organizerSchema.parse(req.body);
        const { name, category, description, email, password, mobile, isDisabled } = validatedData;
        const existing = await Organizer.findOne({ email });
        if (existing) {
            res.status(400).json({ message: "Organizer already exists" });
            return;
        }
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        const organizer = new Organizer({ name, category, description, email, passwordHash, mobile, isDisabled });
        await organizer.save();
        res.status(201).json({ message: "Organizer added successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

adminRouter.get("/organizers", sessionMiddleware(["admin"]), async (req, res): Promise<void> => {
    try {
        const organizers = await Organizer.find().select("-passwordHash");
        res.status(200).json({ organizers });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

adminRouter.delete("/organizers/:id", sessionMiddleware(["admin"]), async (req, res): Promise<void> => {
    try {
        const id = req.params.id;
        const organizer = await Organizer.findByIdAndDelete(id);
        if (!organizer) {
            res.status(404).json({ message: "Organizer not found" });
            return;
        }
        res.status(200).json({ message: "Organizer deleted successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

adminRouter.put("/organizers/:id", sessionMiddleware(["admin"]), async (req, res): Promise<void> => {
    try {
        const id = req.params.id;
        const { isDisabled } = req.body;
        const organizer = await Organizer.findByIdAndUpdate(id, { isDisabled });
        if (!organizer) {
            res.status(404).json({ message: "Organizer not found" });
            return;
        }
        res.status(200).json({ message: "Organizer updated successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
});


export default adminRouter;

