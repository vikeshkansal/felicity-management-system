import mongoose from "mongoose";
const { Schema } = mongoose;

const eventModel = new Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['normal', 'merchandise'],
        required: true
    },
    eligibility: {
        type: String,
        required: true
    },
    regDeadline: {
        type: Date,
        required: true
    },
    regLimit: {
        type: Number,
        required: true
    },
    regFee: {
        type: Number,
        required: true
    },
    tags: {
        type: [String],
        required: true
    },
    start: {
        type: Date,
        required: true
    },
    end: {
        type: Date,
        required: true
    },
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organizer",
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'closed', 'ongoing', 'completed'],
        default: 'draft',
        required: true
    },

    itemDetails: {
        sizes: { type: [String], default: [] },
        colors: { type: [String], default: [] },
        variants: { type: [String], default: [] }
    },
    stockQuantity: {
        type: Number,
        default: 0
    },
    purchaseLimitPerParticipant: {
        type: Number,
        default: 1
    },

    customForm: [{
        fieldName: { type: String, required: true },
        fieldType: { type: String, enum: ['text', 'dropdown', 'checkbox', 'file'], required: true },
        required: { type: Boolean, default: false },
        options: { type: [String], default: [] },
        order: { type: Number, required: true }
    }]
}, { timestamps: true });

const Event = mongoose.model("Event", eventModel);

export default Event;