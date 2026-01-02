const formData = new FormData();
formData.append("photo", file); // ⚠️ ensure karein yahan "photo" hai, "image" nahi
formData.append("employeeId", user.employeeId);