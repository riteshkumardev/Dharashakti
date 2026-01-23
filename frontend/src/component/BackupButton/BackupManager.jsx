import React, { useState, useRef } from 'react';
import axios from 'axios';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable"; // 👈 Direct import for stability

const BackupManager = () => {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // --- 1. DOWNLOAD JSON BACKUP ---
  const downloadBackup = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/backup/export-all`, {
        responseType: 'blob',
        withCredentials: true
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const date = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `Daharasakti_Backup_${date}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download Error:", error);
      alert(`Backup fail! Request sent to: ${API_BASE_URL}/api/backup/export-all`);
    } finally {
      setLoading(false);
    }
  };

  // --- 2. DOWNLOAD PDF REPORT ---
  const downloadPDF = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/backup/export-all`, {
        withCredentials: true
      });
      
      const backupData = response.data;
      const doc = new jsPDF('p', 'mm', 'a4');
      let currentY = 20;

      // Report Header
      doc.setFontSize(20);
      doc.setTextColor(44, 62, 80);
      doc.text("Daharasakti Business Report", 14, 15);
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);
      doc.line(14, 25, 196, 25);
      currentY = 35;

      // Collections Loop
      Object.entries(backupData.collections).forEach(([title, data]) => {
        if (data && Array.isArray(data) && data.length > 0) {
          // Page check: Agar jagah kam hai toh add page
          if (currentY > 260) {
            doc.addPage();
            currentY = 20;
          }

          doc.setFontSize(14);
          doc.setTextColor(52, 152, 219);
          doc.text(title.toUpperCase(), 14, currentY);

          const headers = Object.keys(data[0]).filter(key => key !== '_id' && key !== '__v');
          const rows = data.map(item => headers.map(header => String(item[header] || "")));

          // ✅ Using direct autoTable function call to avoid Prototype errors
          autoTable(doc, {
            head: [headers],
            body: rows,
            startY: currentY + 5,
            margin: { left: 14, right: 14 },
            theme: 'striped',
            styles: { fontSize: 7, cellPadding: 2 }, // Text thoda chhota for better fit
            headStyles: { fillColor: [41, 128, 185], textColor: 255 },
            didDrawPage: (data) => {
               // Update currentY for multiple tables
               currentY = data.cursor.y + 15;
            }
          });
          
          // Fallback currentY update
          currentY = (doc).lastAutoTable.finalY + 15;
        }
      });

      doc.save(`Daharasakti_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("PDF Error Detailed:", error);
      alert("PDF banane mein problem aayi! Console check karein.");
    } finally {
      setLoading(false);
    }
  };

  // --- 3. RESTORE BACKUP LOGIC ---
  const handleRestore = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const confirmRestore = window.confirm("DHYAN DEIN: Purana data delete ho jayega. Kya aap restore karna chahte hain?");
    if (!confirmRestore) {
      event.target.value = null;
      return;
    }

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);
        const response = await axios.post(`${API_BASE_URL}/api/backup/restore`, jsonData, { withCredentials: true });
        if (response.data.success) {
          alert("Data successfully restore ho gaya! ✅");
          window.location.reload(); 
        }
      } catch (error) {
        console.error("Restore Error:", error);
        alert("Restore failed!");
      } finally {
        setLoading(false);
        event.target.value = null; 
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ display: 'flex', gap: '10px', padding: '10px', flexWrap: 'wrap' }}>
      <button onClick={downloadBackup} disabled={loading} style={buttonStyle("#28a745", loading)}>
        {loading ? "⌛..." : "📥 JSON Backup"}
      </button>

      <button onClick={downloadPDF} disabled={loading} style={buttonStyle("#dc3545", loading)}>
        {loading ? "⌛..." : "📄 PDF Report"}
      </button>

      <input type="file" accept=".json" ref={fileInputRef} onChange={handleRestore} style={{ display: 'none' }} />
      
      <button onClick={() => fileInputRef.current.click()} disabled={loading} style={buttonStyle("#007bff", loading)}>
        {loading ? "⌛..." : "📤 Restore JSON"}
      </button>
    </div>
  );
};

const buttonStyle = (color, loading) => ({
  padding: "10px 18px",
  backgroundColor: loading ? "#ccc" : color,
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: loading ? "not-allowed" : "pointer",
  fontSize: "13px",
  fontWeight: "bold"
});

export default BackupManager;