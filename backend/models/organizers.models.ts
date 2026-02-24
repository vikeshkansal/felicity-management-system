import mongoose from "mongoose";
const { Schema } = mongoose;

const organizerModel = new Schema({
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  mobile: {
    type: String,
    required: true
  },
  isDisabled: {
    type: Boolean,
    default: false
  },
  discordWebhook: {
    type: String,
    required: false
  }
});

const Organizer = mongoose.model("Organizer", organizerModel);
export default Organizer;