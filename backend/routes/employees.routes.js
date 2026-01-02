import express from "express";
import {
  createEmployee,
  getAllEmployees,
  updateEmployeeStatus,deleteEmployee
} from "../controllers/employees.controller.js";

const router = express.Router();

// Route configuration
router.post("/", createEmployee);
router.get("/", getAllEmployees);
router.put("/:employeeId", updateEmployeeStatus);
router.delete("/:id", deleteEmployee);

export default router;