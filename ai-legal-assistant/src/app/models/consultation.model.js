import mongoose from "mongoose";

const ConsultationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },   // client
  lawyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // lawyer
  dateTime: { type: Date, required: true },
  mode: { type: String, enum: ["chat", "call", "video"], default: "chat" },
  status: { type: String, enum: ["booked", "completed", "cancelled"], default: "booked" },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
}, { timestamps: true });

export default mongoose.models.Consultation || mongoose.model("Consultation", ConsultationSchema);
