import express from "express";
import Organizer from "../models/organizers.models.js";
import sessionMiddleware from "../middleware/session.middleware.js";
import Participant from "../models/participants.models.js";
import bcrypt from "bcrypt";

const participantRouter = express.Router();

participantRouter.get("/organizers", async (req, res): Promise<void> => {
    try {
        const organizers = await Organizer.find().select("name category description email");
        res.status(200).json(organizers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

participantRouter.get("/organizers/:id", async (req, res): Promise<void> => {
    try {
        const organizer = await Organizer.findById(req.params.id).select("name category description email");
        if (!organizer) {
            res.status(404).json({ message: "Organizer not found" });
            return;
        }
        res.status(200).json(organizer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

participantRouter.get("/profile", sessionMiddleware(["participant"]), async (req, res): Promise<void> => {
    try {
        const userID = res.locals.user.userId;
        const participant = await Participant.findById(userID).select("-passwordHash").populate("following", "name category");
        if (!participant) {
            res.status(404).json({ message: "Participant not found" });
            return;
        }
        res.status(200).json(participant);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

participantRouter.put("/profile", sessionMiddleware(["participant"]), async (req, res): Promise<void> => {
    try {
        const userID = res.locals.user.userId;
        let user = await Participant.findById(userID);
        if (!user) {
            res.status(404).json({ message: "user not found!" })
            return;
        }
        const { firstName, lastName, mobile, orgName, interests, onboardingCompleted } = req.body;
        if (user.name) {
            if (firstName) user.name.firstName = firstName;
            if (lastName) user.name.lastName = lastName;
        }
        if (mobile) user.mobile = mobile;
        if (orgName && user.participantType !== "IIIT-H") user.orgName = orgName;
        if (interests) user.interests = interests;
        if (typeof onboardingCompleted === 'boolean') user.onboardingCompleted = onboardingCompleted;
        await user.save();
        res.status(200).json({ message: "Profile updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

participantRouter.post("/follow/:organizerId", sessionMiddleware(["participant"]), async (req, res): Promise<void> => {
    try {
        const userID = res.locals.user.userId;
        const organizerID = req.params.organizerId;
        const user = await Participant.findByIdAndUpdate(userID, {
            $addToSet: { following: organizerID }
        });
        if (!user) {
            res.status(404).json({ message: "user not found!" })
            return;
        }
        res.status(200).json({ message: "Followed successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error!" });
    }
});

participantRouter.delete("/follow/:organizerId", sessionMiddleware(["participant"]), async (req, res): Promise<void> => {
    try {
        const userID = res.locals.user.userId;
        const organizerID = req.params.organizerId;
        const user = await Participant.findByIdAndUpdate(userID, {
            $pull: { following: organizerID }
        });
        if (!user) {
            res.status(404).json({ message: "user not found!" })
            return;
        }
        res.status(200).json({ message: "Unfollowed successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error!" });
    }
});

participantRouter.put("/change-password", sessionMiddleware(["participant"]), async (req, res): Promise<void> => {
    try {
        const userID = res.locals.user.userId;
        const { currentPassword, newPassword, confirmNewPassword } = req.body;
        const user = await Participant.findById(userID);
        if (!user) {
            res.status(404).json({ message: "user not found!" })
            return;
        }
        if (!bcrypt.compareSync(currentPassword, user.passwordHash)) {
            res.status(400).json({ message: "Invalid old password" });
            return;
        }
        if (newPassword !== confirmNewPassword) {
            res.status(400).json({ message: "Passwords do not match" });
            return;
        }
        user.passwordHash = bcrypt.hashSync(newPassword, 10);
        await user.save();
        res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error!" });
    }
})
export default participantRouter;