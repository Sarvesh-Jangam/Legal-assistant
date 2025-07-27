import mongoose from "mongoose";

const ChatSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  question: { type: String, required: true },
  response: { type: String, required: true },
  fileName: { type: String, default: "" }
},{timestamps:true});

export default mongoose.models.Chat || mongoose.model("Chat", ChatSchema);