import express from 'express';
const router = express.Router();

// Controller functions ko individually import karein (ESM style)
// .js extension lagana mat bhulna
import { addTransaction, getTransactionHistory } from '../controllers/transaction.controller.js';

// 1. Naya transaction add karne ke liye (POST request)
// URL: http://localhost:5000/api/transactions/add
router.post('/add', addTransaction);

// 2. Kisi specific party ki puri history dekhne ke liye (GET request)
// URL: http://localhost:5000/api/transactions/history/:id
router.get('/history/:id', getTransactionHistory);

export default router;