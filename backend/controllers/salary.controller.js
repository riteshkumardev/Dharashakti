import SalaryPayment from "../models/SalaryPayment.js"; // Path check karein

// ✅ Kisi specific employee ki payment history nikalna
export const getPaymentHistory = async (req, res) => {
  try {
    const { id } = req.params;
    // Database se employeeId ke basis par history nikalna
    const data = await SalaryPayment.find({ employeeId: id });
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("Fetch Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ✅ Naya payment/advance add karna
export const addPayment = async (req, res) => {
  try {
    // Frontend se aane wale data (amount, date, employeeId) ko save karna
    const payment = await SalaryPayment.create(req.body);
    res.status(201).json({ success: true, data: payment });
  } catch (err) {
    console.error("Create Error:", err);
    res.status(400).json({ success: false, message: "Invalid Data or Missing Fields" });
  }
};