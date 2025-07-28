import mongoose from "mongoose";

const ChatSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  title: { type: String, required: true }, //title
  // response: { type: String, required: true },
  fileName: { type: String, default: "" }
},{timestamps:true});

export default mongoose.models.Chat || mongoose.model("Chat", ChatSchema);