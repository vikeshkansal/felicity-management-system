import mongoose from "mongoose";
const { Schema } = mongoose;

const participantModel = new Schema({
  name: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true }
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  participantType: {
    type: String,
    enum: ['IIIT-H', 'External'],
    required: true
  },
  orgName: {
    type: String,
    required: true
  },
  mobile: {
    type: String,
    required: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  interests: {
    type: [String],
    default: []
  },
  following: [{
    type: Schema.Types.ObjectId,
    ref: "Organizer"
  }],
  onboardingCompleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const Participant = mongoose.model("Participant", participantModel);
export default Participant;