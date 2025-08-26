import User from './user.model.js';
import mongoose from 'mongoose';

const LawyerSchema = new mongoose.Schema({
  specialization: { type: String },
  barId: { type: String },
  experience: { type: Number },
  feePerHour: { type: Number },
  availabilitySchedule: [{ day: String, startTime: String, endTime: String }],
  verificationStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
});

export const Lawyer = User.discriminator("lawyer", LawyerSchema);
