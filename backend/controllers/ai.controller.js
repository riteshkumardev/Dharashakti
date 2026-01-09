import axios from "axios";

export const getAIAdvice = async (req, res) => {
  try {
    const { receive = 0, pay = 0 } = req.body;
    const net = receive - pay;

    // 1. Backend .env se API Key uthayein
    const API_KEY = process.env.REACT_APP_GEMINI_KEY;

    // 2. Agar Key nahi hai toh purana logic fallback ki tarah chalega
    if (!API_KEY) {
      let staticAdvice = "Business stable hai 🙂";
      if (net < 0) staticAdvice = "⚠️ Payable zyada hai, receivable fast collect karo 💰";
      else if (net > 0) staticAdvice = "✅ Cash flow acha hai, smart reinvestment socho 🚀";
      
      return res.status(200).json({
        success: true,
        reply: staticAdvice, // Frontend 'reply' dhoond raha hai
        net
      });
    }

    // 3. Gemini 2.0 Flash Intelligent Prompt
    const prompt = `
      Business: Dhara Shakti Agro.
      Financials: Receivables ₹${receive}, Payables ₹${pay}, Net Balance ₹${net}.
      Task: Ek expert financial advice do Hinglish mein (max 2 lines). Emojis use karo.
    `;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
      { contents: [{ parts: [{ text: prompt }] }] }
    );

    const aiReply = response.data.candidates[0].content.parts[0].text;

    return res.status(200).json({
      success: true,
      receive,
      pay,
      net,
      reply: aiReply // Frontend expectation matched
    });

  } catch (error) {
    console.error("AI Controller Error:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      reply: "⚠️ AI service thodi der mein try karein.",
      message: error.message
    });
  }
};