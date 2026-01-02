import axios from "axios";

// React variables load karne ke liye process.env use hota hai
const baseURL = process.env.REACT_APP_API_URL 
  ? `${process.env.REACT_APP_API_URL}/api` 
  : "http://localhost:5000/api";

export const api = axios.create({
  baseURL: baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});