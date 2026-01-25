import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    employeeId: { 
      type: String, 
      unique: true, 
      // Agar aap ise frontend se nahi bhej rahe, toh ise 'required' mat rakhiye
      sparse: true 
    },
    name: { type: String, required: [true, "Name is required"], trim: true },
    fatherName: { type: String, trim: true },
    phone: { type: String, required: [true, "Phone number is required"] },
    emergencyPhone: String,
    aadhar: { 
      type: String, 
      unique: true, 
      required: [true, "Aadhar is required"],
      minlength: [12, "Aadhar must be 12 digits"],
      maxlength: [12, "Aadhar must be 12 digits"]
    },
    address: { type: String, trim: true },
    designation: String,
    joiningDate: { type: Date, default: Date.now }, 
    salary: { 
      type: Number, 
      required: [true, "Salary is required"],
      min: [0, "Salary cannot be negative"],
      default: 0 // Agar UI se 0 ja raha hai toh ye error nahi dega
    },
    bankName: String,
    accountNo: { type: String, trim: true }, // Account number ke spaces hatane ke liye
    ifscCode: { type: String, trim: true },
    photo: String, 
    password: { type: String, required: [true, "Password is required"] },
    role: {
      type: String,
      enum: ["Admin", "Manager", "Worker", "Operator", "Driver", "Helper"], 
      default: "Worker",
    },
    isBlocked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Employee", employeeSchema);