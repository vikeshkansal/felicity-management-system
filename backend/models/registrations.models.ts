import { Schema } from "mongoose";
import mongoose from "mongoose";

const registrationModel = new Schema({
    event: {
        type: Schema.Types.ObjectId,
        ref: "Event",
        required: true
    },
    participant: {
        type: Schema.Types.ObjectId,
        ref: "Participant",
        required: true
    },
    status: {
        type: String,
        enum: ["registered", "confirmed", "cancelled"],
        default: "registered"
    },
    registrationDate: {
        type: Date,
        default: Date.now
    },
    ticketId: {
        type: String,
        required: true
    },
    ticketQrCode: {
        type: String,
        required: true
    },
    customFormResponses: {
        type: [
            {
                fieldName: { type: String, required: true },
                value: { type: Schema.Types.Mixed, required: true }
            }
        ],
        default: []
    },
    merchandiseSelection: {
        size: { type: String },
        color: { type: String },
        variant: { type: String }
    }
}, { timestamps: true });

const Registration = mongoose.model("Registration", registrationModel);
export default Registration;