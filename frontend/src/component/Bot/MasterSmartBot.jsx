import React, {
  useState,
  useEffect,
  useCallback,
  useRef
} from 'react';
import axios from 'axios';
import './MasterBot.css';
import BackupRestoreBot from './BackupRestoreBot';
import AddTransaction from '../AddTransaction/AddTransaction';

const MasterSmartBot = () => {
  const [activeTab, setActiveTab] = useState('auto');
  const [isListening, setIsListening] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const [chatLog, setChatLog] = useState([
    {
      sender: 'bot',
      text:
        'Namaste! Main aapka Dharashakti Assistant hoon. Ledger ya duniya ka sawal poochiye.'
    }
  ]);

  const [stats, setStats] = useState({
    totalSales: 0,
    totalDue: 0,
    pendingCount: 0
  });

  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const API_BASE_URL =
    process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  /* 🔊 Safe Speak */
  const speak = useCallback((text) => {
    if (!window.speechSynthesis) return;

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'hi-IN';
    u.rate = 1;
    u.pitch = 1;

    window.speechSynthesis.speak(u);
  }, []);

  const addChat = useCallback((sender, text) => {
    setChatLog((prev) => [...prev, { sender, text }]);
  }, []);

  /* 🌍 External AI */
  const askWorldAI = async (question) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/ai/ask`, {
        prompt: question
      });
      return res.data.answer || 'Koi jawab nahi mila.';
    } catch {
      return 'Maaf kijiye, internet se jawab nahi mil pa raha.';
    }
  };

  /* 🧠 Command Processor */
  const processCommand = useCallback(
    async (cmd) => {
      const lower = cmd.toLowerCase();
      let reply = '';

      /* 📒 Ledger */
      if (
        lower.includes('hisab') ||
        lower.includes('हिसाब') ||
        lower.includes('ledger') ||
        lower.includes('खाता')
      ) {
        setActiveTab('payment');
        setShowChat(false);
        reply = 'Ledger screen khol diya gaya hai.';
      }

      /* 💰 Due */
      else if (
        lower.includes('udhari') ||
        lower.includes('उधारी') ||
        lower.includes('due')
      ) {
        reply =
          stats.totalDue > 0
            ? `Abhi total udhaari ₹${stats.totalDue.toLocaleString()} hai.`
            : 'Koi udhaari pending nahi hai.';
      }

      /* 🌍 World AI */
      else if (
        lower.includes('मौसम') ||
        lower.includes('weather') ||
        lower.includes('news') ||
        lower.includes('internet') ||
        lower.startsWith('kaun') ||
        lower.startsWith('kya')
      ) {
        addChat('bot', '🔍 Internet par check kar raha hoon...');
        reply = await askWorldAI(cmd);
      }

      /* 🤖 Fallback */
      else {
        reply = 'Aap ledger dekhenge ya duniya ka koi sawal poochhna hai?';
      }

      speak(reply);
      setShowChat(true);
      addChat('bot', reply);
    },
    [stats, speak, addChat]
  );

  /* 🖱️ Text command */
  const handleTextCommand = (text) => {
    addChat('user', text);
    processCommand(text);
  };

  /* 🎙️ Voice Listener */
  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Voice support available nahi hai');
      return;
    }

    if (!recognitionRef.current) {
      const rec = new SpeechRecognition();
      rec.lang = 'hi-IN';
      rec.continuous = false;
      rec.interimResults = false;

      rec.onstart = () => setIsListening(true);
      rec.onend = () => setIsListening(false);

      rec.onresult = (e) => {
        const text = e.results[0][0].transcript;
        handleTextCommand(text);
      };

      recognitionRef.current = rec;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  /* 📊 Stats */
  const fetchStats = useCallback(async () => {
    try {
      const res = await axios
        .get(`${API_BASE_URL}/sales`)
        .catch(() => ({ data: { data: [] } }));

      const sales = res.data.data || [];
      const pending = sales.filter((s) => s.paymentDue > 0);
      const totalDue = pending.reduce((a, b) => a + b.paymentDue, 0);

      setStats({
        totalSales: sales.length,
        totalDue,
        pendingCount: pending.length
      });
    } catch (e) {
      console.error(e);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog]);

  return (
    <div className="bot-master-container neo-3d">
      <div className="bot-main-view">
        <header className="view-header">
          <div className="status-badge">ALEXA_MODE_ACTIVE</div>
          <h2>DHARASHAKTI {activeTab.toUpperCase()} CENTER</h2>
        </header>

        <div className="view-content">
          {activeTab === 'auto' && (
            <div className="stat-card-3d master-alert">
              <h4>AI Status</h4>
              <p>Udhaari: ₹{stats.totalDue.toLocaleString()}</p>
            </div>
          )}

          {activeTab === 'payment' && (
            <AddTransaction onTransactionAdded={fetchStats} />
          )}

          {activeTab === 'backup' && <BackupRestoreBot />}
        </div>
      </div>

      {/* 🤖 Floating Bot */}
      <div
        className={`floating-bot-container ${
          showChat ? 'expanded' : 'collapsed'
        }`}
      >
        {showChat && (
          <div className="chat-window neo-3d">
            <div className="chat-header">Dharashakti AI</div>

            <div className="chat-body">
              {chatLog.map((c, i) => (
                <div key={i} className={`chat-bubble ${c.sender}`}>
                  {c.text}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <div className="quick-options">
              <button onClick={() => handleTextCommand('लेजर दिखाओ')}>
                📒 Ledger
              </button>
              <button onClick={() => handleTextCommand('उधारी कितनी है')}>
                💰 Udhaari
              </button>
              <button onClick={() => handleTextCommand('आज का मौसम क्या है')}>
                🌍 Sawal
              </button>
            </div>

            <div className="chat-footer">
              <button
                className={`voice-btn ${isListening ? 'active' : ''}`}
                onClick={startListening}
              >
                {isListening ? '🛑' : '🎙️'}
              </button>
            </div>
          </div>
        )}

        <div
          className="main-bot-avatar"
          onClick={() => setShowChat(!showChat)}
        >
          🤖
        </div>
      </div>
    </div>
  );
};

export default MasterSmartBot;
