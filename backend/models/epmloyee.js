import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    employeeId: { 
      type: String, 
      unique: true, 
      required: [true, "Employee ID is mandatory"] // सुरक्षा के लिए अनिवार्य किया
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
    address: String,
    designation: String,
    joiningDate: { type: Date, default: Date.now }, // String की जगह Date ज्यादा उपयोगी है
    salary: { 
      type: Number, 
      required: [true, "Salary is required"],
      min: [0, "Salary cannot be negative"] // नेगेटिव सैलरी से बचाव
    },
    bankName: String,
    accountNo: String,
    ifscCode: String,
    photo: String, 
    password: { type: String, required: true },
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