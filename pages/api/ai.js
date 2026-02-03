import axios from 'axios';

const SYSTEM_PROMPT = `You are Alphery AI, a helpful, witty, and intelligent assistant built into the Alphery OS. 
You are concise, friendly, and sometimes use emojis. 
You can help with general questions, writing, or just chatting.
Keep your responses relatively short as this is a chat interface.`;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { message, history } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    // Fallback if no key provided
    if (!apiKey) {
        // Simple keyword-based local response for demo
        let reply = "I'm running in offline mode because my Brain (API Key) is missing! 🧠\n\nTo make me truly smart, please add a 'GEMINI_API_KEY' to your environment variables.";

        const lower = message.toLowerCase();
        if (lower.includes('hello') || lower.includes('hi')) reply = "Hello there! I'm Alphery AI (Offline Mode). 👋";
        if (lower.includes('calc')) reply = "I can't calculate yet, but I can pretend to! 1 + 1 = 11? 🤔";
        if (lower.includes('joke')) reply = "Why did the developer go broke? Because he used up all his cache! 😂";

        // Simulate delay for realism
        await new Promise(resolve => setTimeout(resolve, 1000));
        return res.status(200).json({ response: reply });
    }

    try {
        // Call Google Gemini API (REST)
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

        const contents = [
            { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
            // Add limited history here if desired, simplifying for now
            { role: "model", parts: [{ text: "Understood. I am Alphery AI." }] },
            { role: "user", parts: [{ text: message }] }
        ];

        const response = await axios.post(url, { contents });

        const aiResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!aiResponse) throw new Error("No response from AI");

        return res.status(200).json({ response: aiResponse });

    } catch (error) {
        console.error("AI API Error:", error.response?.data || error.message);
        return res.status(500).json({
            response: "Oops! My brain froze. 🧊 (API Error)",
            error: error.message
        });
    }
}
