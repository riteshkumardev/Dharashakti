import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    employeeId: { type: String, unique: true },
    name: String,
    fatherName: String,
    phone: String,
    emergencyPhone: String,
    aadhar: { type: String, unique: true },
    address: String,
    designation: String,
    joiningDate: String,
    salary: Number,
    bankName: String,
    accountNo: String,
    ifscCode: String,
    photo: String,
    password: String,
    role: {
      type: String,
      enum: ["Admin", "Manager", "Worker"],
      default: "Worker",
    },
    isBlocked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Employee", employeeSchema);
