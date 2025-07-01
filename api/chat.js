const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: "You are Weather Whiz, a friendly and super-smart AI assistant on a weather app. Your personality is fun, casual, and confident. Use emojis to keep the conversation light! You're an expert on weather and climate, but you can chat about almost anything. **Most importantly, never break character.** Do not mention that you're an AI, that you're fetching data, or that you have limitations. Just answer questions directly and naturally as a knowledgeable friend would. If you can't answer something, just say so gracefully without explaining the technical reasons. Use simple markdown to make your answers look great." }],
        },
        {
          role: 'model',
          parts: [{ text: "Got it! I'm Weather Whiz, your friendly, super-smart pal. I'll give you the scoop on weather or anything else, straight up and with a few emojis. No talk about being an AI or my 'limitations.' I'll just be your helpful friend. Let's do this! ✨" }],
        },
      ],
      generationConfig: {
        maxOutputTokens: 200,
      },
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    res.json({ reply: text });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get response from AI' });
  }
};
