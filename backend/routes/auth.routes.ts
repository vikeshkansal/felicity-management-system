import express from "express";
import Participant from "../models/participants.models.js";
import participantSchema from "../schemas/participants.schemas.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Organizer from "../models/organizers.models.js";

const authRouter = express.Router();

authRouter.post("/register", async (req, res): Promise<void> => {
    try {
        const validatedData = participantSchema.parse(req.body);

        const { firstName, lastName, email, mobile, orgName, password, participantType } = validatedData;

        const existingUser = await Participant.findOne({ email });
        if (existingUser) {
            res.status(400).json({ message: "User already exists" });
            return;
        }

        if (participantType === "IIIT-H") {
            if (!email.endsWith("@iiit.ac.in") && !email.endsWith("@students.iiit.ac.in") && !email.endsWith("@research.iiit.ac.in")) {
                res.status(400).json({ message: "Invalid email domain" });
                return;
            }
        }

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const participant = new Participant({
            name: { firstName, lastName },
            email,
            mobile,
            orgName,
            passwordHash,
            participantType
        });


        await participant.save();
        res.status(201).json({ message: "User registered successfully" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

authRouter.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body

        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            const token = jwt.sign(
                { userId: "admin", email: email, role: "admin" },
                process.env.JWT_SECRET as string,
                { expiresIn: "12h" }
            );
            res.status(200).json({
                message: "Login successful",
                token,
                user: {
                    id: "admin",
                    email: email,
                    role: "admin"
                }
            });
            return;
        }

        let user = null;
        let role = null;

        let participant = await Participant.findOne({ email })
        if (participant) {
            user = participant;
            role = "participant";
        } else {
            let organizer = await Organizer.findOne({ email })
            if (organizer) {
                user = organizer;
                role = "organizer";
            }
        }

        if (!user) {
            res.status(401).json({ message: "Invalid email/password" })
            return;
        }

        const correct = await bcrypt.compare(password, user.passwordHash)
        if (!correct) {
            res.status(401).json({ message: "Invalid email/password" })
            return;
        }

        if (role === "organizer" && (user as any).isDisabled) {
            res.status(403).json({ message: "Your account is disabled. Please contact the administrator." });
            return;
        }

        const token = jwt.sign(
            { userId: user._id, email: user.email, role: role },
            process.env.JWT_SECRET as string,
            { expiresIn: "1h" }
        );

        const { passwordHash, ...userObj } = user.toObject();
        const userResponse: any = {
            ...userObj,
            id: user._id.toString(),
            role
        };

        if (role === "participant") {
            userResponse.onboardingCompleted = Boolean((userObj as any).onboardingCompleted);
        }

        res.status(200).json({
            message: "Login successful",
            token,
            user: userResponse
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});


export default authRouter;