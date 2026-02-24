import express from "express";
import sessionMiddleware from "../middleware/session.middleware.js";
import Organizer from "../models/organizers.models.js";
import Event from "../models/events.models.js";
import Registration from "../models/registrations.models.js";

const organizerRouter = express.Router();

organizerRouter.get("/profile", sessionMiddleware(["organizer"]), async (req, res): Promise<void> => {
    try {
        const userID = res.locals.user.userId;
        const organizer = await Organizer.findById(userID).select("-passwordHash")
        if (!organizer) {
            res.status(404).json({ message: "Organizer not found" });
            return;
        }
        res.status(200).json(organizer);
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "internal server error" })
    }
});

organizerRouter.put("/profile", sessionMiddleware(["organizer"]), async (req, res): Promise<void> => {
    try {
        const userID = res.locals.user.userId;
        let user = await Organizer.findById(userID);
        if (!user) {
            res.status(404).json({ message: "user not found!" })
            return;
        }
        const { name, category, description, mobile, discordWebhook } = req.body;
        if (name !== undefined) user.name = name;
        if (category !== undefined) user.category = category;
        if (description !== undefined) user.description = description;
        if (mobile !== undefined) user.mobile = mobile;
        if (discordWebhook !== undefined) user.discordWebhook = discordWebhook;
        await user.save();
        res.status(200).json({ message: "Profile updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

organizerRouter.get("/dashboard", sessionMiddleware(["organizer"]), async (req, res): Promise<void> => {
    try {
        const userID = res.locals.user.userId;
        const events = await Event.find({ organizer: userID }).select("-organizer");
        const groupedEvents = {
            draft: events.filter(e => e.status === "draft"),
            published: events.filter(e => e.status === "published"),
            ongoing: events.filter(e => e.status === "ongoing"),
            closed: events.filter(e => e.status === "closed"),
            completed: events.filter(e => e.status === "completed")
        };

        const completedEvents = groupedEvents.completed;
        let totalRegistrations = 0;
        let totalRevenue = 0;

        for (const event of completedEvents) {
            const regCount = await Registration.countDocuments({ event: event._id as any, status: "confirmed" });
            totalRegistrations += regCount;
            totalRevenue += regCount * event.regFee;
        }

        res.status(200).json({
            events: groupedEvents,
            analytics: {
                totalRegistrations,
                totalRevenue,
                completedEventsCount: completedEvents.length
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
})

organizerRouter.get("/my-events", sessionMiddleware(["organizer"]), async (req, res): Promise<void> => {
    try {
        const userID = res.locals.user.userId;
        const { status } = req.query;
        let query: any = { organizer: userID };
        if (status) query.status = status;
        const events = await Event.find(query).select("-organizer").sort({ createdAt: -1 });
        res.status(200).json(events);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
})

organizerRouter.post("/events/:id/publish", sessionMiddleware(["organizer"]), async (req, res): Promise<void> => {
    try {
        const userID = res.locals.user.userId;
        const eventID = req.params.id;
        const event = await Event.findById(eventID);
        if (!event) {
            res.status(404).json({ message: "Event not found" });
            return;
        }

        if (event.organizer.toString() !== userID) {
            res.status(403).json({ message: "Unauthorized" });
            return;
        }

        const requiredFields = ["name", "description", "type", "eligibility", "regDeadline", "regLimit", "regFee", "start", "end"] as const;
        for (const field of requiredFields) {
            const value = event[field as keyof typeof event];
            if (value === undefined || value === null || (typeof value === "string" && value.trim() === "")) {
                res.status(400).json({ message: `Missing required field: ${field}` });
                return;
            }
        }
        event.status = "published";
        await event.save();

        const organizer = await Organizer.findById(userID);
        if (organizer && organizer.discordWebhook) {
            try {
                await fetch(organizer.discordWebhook, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        content: `**New Event Published!**\n\n**${event.name}**\n${event.description}\n\n Date: ${new Date(event.start).toDateString()}\n Fee: ${event.regFee}\n Check it out now!`
                    })
                });
            } catch (discordError) {
                console.error("Failed to send Discord webhook:", discordError);
            }
        }

        res.status(200).json({ message: "Event published successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
})

organizerRouter.get("/events/:id/participants", sessionMiddleware(["organizer"]), async (req, res): Promise<void> => {
    try {
        const userID = res.locals.user.userId;
        const eventID = req.params.id;
        const { search, status } = req.query;

        const event = await Event.findById(eventID);
        if (!event) {
            res.status(404).json({ message: "Event not found" });
            return;
        }
        if (event.organizer.toString() !== userID) {
            res.status(403).json({ message: "Unauthorized" });
            return;
        }

        let query: any = { event: eventID };
        if (status) query.status = status;

        let registrations = await Registration.find(query).populate("participant", "name email");

        if (search) {
            const searchStr = (search as string).toLowerCase();
            registrations = registrations.filter(reg => {
                const p = reg.participant as any;
                if (!p) return false;
                const fullName = `${p.name?.firstName || ''} ${p.name?.lastName || ''}`.toLowerCase();
                const email = p.email?.toLowerCase() || '';
                return fullName.includes(searchStr) || email.includes(searchStr);
            });
        }

        res.status(200).json(registrations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
})

organizerRouter.get("/events/:id/stats", sessionMiddleware(['organizer']), async (req, res): Promise<void> => {
    try {
        const userID = res.locals.user.userId;
        const eventID = req.params.id;

        const event = await Event.findById(eventID);
        if (!event) {
            res.status(404).json({ message: "Event not found" });
            return;
        }
        if (event.organizer.toString() !== userID) {
            res.status(403).json({ message: "Unauthorized" });
            return;
        }

        const totalRegistrations = await Registration.countDocuments({ event: eventID as any });
        const confirmedRegistrations = await Registration.countDocuments({ event: eventID as any, status: 'confirmed' });
        const revenue = confirmedRegistrations * event.regFee;
        const attendanceRate = totalRegistrations > 0 ? (confirmedRegistrations / totalRegistrations) * 100 : 0;

        res.status(200).json({
            registrationCount: totalRegistrations,
            revenue,
            attendanceRate: `${attendanceRate.toFixed(2)}%`
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
})

export default organizerRouter;