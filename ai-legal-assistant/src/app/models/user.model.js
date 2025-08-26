import mongoose from "mongoose";
const options = { discriminatorKey: "role", timestamps: true };

const BaseUserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  phone: { type: String },
  passwordHash: { type: String, required: true },
}, options);

const User = mongoose.models.User || mongoose.model("User", BaseUserSchema);
export default User;
