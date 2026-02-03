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
        console.log("Attempting to call Gemini API (v1 with 2.0-flash)...");
        const model = 'gemini-2.0-flash';
        const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;

        // Simplified content structure to avoid role issues
        const requestBody = {
            contents: [{
                role: "user",
                parts: [{ text: `${SYSTEM_PROMPT}\n\nUser: ${message}` }]
            }]
        };

        const response = await axios.post(url, requestBody, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
        });

        const aiResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!aiResponse) {
            console.error("Gemini API Response Structure Unexpected:", JSON.stringify(response.data, null, 2));
            throw new Error("No response text in API result");
        }

        return res.status(200).json({ response: aiResponse });

    } catch (error) {
        console.error("============= AI API ERROR =============");
        if (error.response) {
            // Server responded with a status code outside 2xx
            console.error("Status:", error.response.status);
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            // Request was made but no response received
            console.error("No response received:", error.message);
        } else {
            console.error("Error setting up request:", error.message);
        }
        console.error("========================================");

        return res.status(500).json({
            response: "My brain connection is a bit fuzzy. ☁️ (API Error)",
            debug: error.message
        });
    }
}
