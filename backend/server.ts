import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRouter from "./routes/auth.routes.js";
import eventRouter from "./routes/events.routes.js";
import adminRouter from "./routes/admin.routes.js";
import registrationRouter from "./routes/registrations.routes.js";
import participantRouter from "./routes/participants.routes.js";
import organizerRouter from "./routes/organizer.routes.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/auth", authRouter);
app.use("/events", eventRouter);
app.use("/admin", adminRouter);
app.use("/registrations", registrationRouter);
app.use("/participants", participantRouter);
app.use("/organizer", organizerRouter);

app.get('/', (req, res) => {
    res.send("Hello there");
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

