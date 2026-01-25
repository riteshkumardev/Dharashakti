import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import './MasterBot.css';
import BackupRestoreBot from './BackupRestoreBot';
import AddTransaction from '../AddTransaction/AddTransaction';

const MasterSmartBot = () => {
  // 1. States Defined Inside Component
  const [activeTab, setActiveTab] = useState('auto');
  const [isListening, setIsListening] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatLog, setChatLog] = useState([
    { sender: 'bot', text: 'Namaste Suman! Main Dharashakti AI hoon. Kaise madad karoon?' }
  ]);
  const [stats, setStats] = useState({ totalSales: 0, totalDue: 0, pendingCount: 0 });
  
  const chatEndRef = useRef(null);
  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

  // 2. Utility Functions
  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'hi-IN';
    window.speechSynthesis.speak(utterance);
  };

  const addChat = (sender, text) => {
    setChatLog(prev => [...prev, { sender, text }]);
  };

  // ✅ Smart Command Processor: Ab ye stats aur tabs ko access kar payega
  const processCommand = useCallback((cmd) => {
    let reply = "";
    const lowerCmd = cmd.toLowerCase();

    if (lowerCmd.includes("hisab") || lowerCmd.includes("ledger") || lowerCmd.includes("लेजर")) {
      setActiveTab('payment');
      reply = "Theek hai Suman, ledger sync page khul gaya hai.";
    } 
    else if (lowerCmd.includes("udhari") || lowerCmd.includes("due") || lowerCmd.includes("उधारी")) {
      reply = stats.totalDue > 0 
        ? `Suman, abhi total udhaari ₹${stats.totalDue.toLocaleString()} hai.` 
        : "Mubarak ho! Sabka hisaab barabar hai, koi udhaari nahi hai.";
    } 
    else if (lowerCmd.includes("status") || lowerCmd.includes("auto")) {
      setActiveTab('auto');
      reply = `System check complete. Total sales ${stats.totalSales} hain.`;
    } 
    else {
      reply = "Samajh gaya. Kya main aapke liye ledger kholoon ya udhaari bataoon?";
    }

    speak(reply);
    addChat('bot', reply);
  }, [stats]); 

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Browser voice support nahi karta.");

    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    recognition.onresult = (event) => {
      const command = event.results[0][0].transcript;
      addChat('user', command);
      processCommand(command); 
    };
    recognition.start();
  };

  // 3. Data Sync Logic
  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/sales`);
      const sales = res.data.data || [];
      const pending = sales.filter(s => s.paymentDue > 0);
      const totalDue = pending.reduce((sum, s) => sum + s.paymentDue, 0);
      
      setStats({ totalSales: sales.length, totalDue: totalDue, pendingCount: pending.length });
    } catch (err) { console.error("Stats error:", err); }
  }, [API_BASE_URL]);

  useEffect(() => {
    fetchStats();
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [fetchStats, chatLog]);

  return (
    <div className="bot-master-container neo-3d">
      <div className="bot-main-view">
        <header className="view-header">
          <div className="status-badge">AI_READY</div>
          <h2>DHARASHAKTI {activeTab.toUpperCase()} CENTER</h2>
        </header>

        <div className="view-content">
          {activeTab === 'auto' && (
            <div className="auto-engine-view fade-in">
               <div className="stat-card-3d master-alert">
                  <h4>AI Status Report</h4>
                  <p>Udhaari: ₹{stats.totalDue.toLocaleString()}</p>
               </div>
               <div className="stats-grid">
                  <div className="stat-card-3d"><span>Total Sales</span><h4>{stats.totalSales}</h4></div>
                  <div className="stat-card-3d warning"><span>Pending Dues</span><h4>₹{stats.totalDue.toLocaleString()}</h4></div>
               </div>
            </div>
          )}
          {activeTab === 'payment' && <AddTransaction onTransactionAdded={fetchStats} />}
          {activeTab === 'backup' && <BackupRestoreBot />}
        </div>
      </div>

      {/* Floating Chat Bot UI */}
      <div className={`floating-bot-container ${showChat ? 'expanded' : 'collapsed'}`}>
        {showChat && (
          <div className="chat-window neo-3d">
            <div className="chat-header">Dharashakti Chat</div>
            <div className="chat-body">
              {chatLog.map((chat, i) => (
                <div key={i} className={`chat-bubble ${chat.sender}`}>{chat.text}</div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="chat-footer">
               <button className={`voice-btn ${isListening ? 'active' : ''}`} onClick={startListening}>
                  {isListening ? '🛑' : '🎙️'}
               </button>
            </div>
          </div>
        )}
        <div className="main-bot-avatar float-animation" onClick={() => setShowChat(!showChat)}>
           <div className="inner-avatar">🤖</div>
           <div className="pulse-ring"></div>
        </div>
      </div>
    </div>
  );
};

export default MasterSmartBot;