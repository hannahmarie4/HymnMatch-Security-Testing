require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const PORT = process.env.PORT || 5000;
const { loginLimiter } = require('./middleware/rateLimiter');
const recommendationsRouter = require('./routes/recommendations');
const readingsRouter = require('./routes/readings');

app.use('/api/recommendations', recommendationsRouter);
app.use('/api/readings', readingsRouter);

app.get('/', (req, res) => {
    res.send('HymnMatch Secure Backend is Running!');
});

app.post('/auth/login', loginLimiter, async (req, res) => {
  // Existing login logic here
  const { email, password } = req.body;
  
  try {
    // Your login code (Dummy for thesis defense proof)
    if (!email || !password) throw new Error('Missing credentials');
    res.status(200).json({ success: true });
  } catch (error) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/api/analyze-document', async (req, res) => {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        const { imageBase64, mimeType, season } = req.body;
        
        if (!imageBase64) {
            return res.status(400).json({ error: "No image provided" });
        }

        const userSeason = season || 'Ordinary Time';

        const prompt = `You are an expert Catholic Liturgical Music Director.
Analyze this image of a liturgical document (e.g. readings, missal, homily notes).
1. Extract the main text (OCR).
2. Identify the core religious theme (e.g. "Grace", "Repentance", "Eucharist") and the tone (e.g. "Hopeful", "Joyful", "Penitential").
3. Detect the most likely liturgical season from the content (Advent, Christmas, Lent, Easter, Ordinary Time, or Pentecost). The user currently has "${userSeason}" selected — compare your detection against this.
4. List the top 2-3 themes found in the reading.
5. Recommend exactly 1-2 appropriate Catholic hymns for EACH of the following Mass parts: Entrance, Offertory, Communion.
CRITICAL INSTRUCTION: You MUST ONLY recommend officially approved Catholic hymns found in hymnals like Breaking Bread, Gather, Journeysongs, or Catholic Book of Worship (published by OCP, GIA, WLP, etc.). Do NOT recommend secular songs or general non-denominational Protestant worship songs.
Return the result EXACTLY as a raw JSON object with this structure (no markdown formatting):
{
  "extractedText": "...",
  "theme": "Main Theme",
  "themes": ["theme1", "theme2", "theme3"],
  "tone": "...",
  "detectedSeason": "Detected Liturgical Season",
  "seasonConfidence": 95,
  "recommendations": {
    "Entrance": [{ "title": "Song Title", "composer": "Composer Name", "matchScore": 95 }],
    "Offertory": [{ "title": "Song Title", "composer": "Composer Name", "matchScore": 90 }],
    "Communion": [{ "title": "Song Title", "composer": "Composer Name", "matchScore": 92 }]
  }
}`;

        // The base64 string usually looks like "data:image/jpeg;base64,/9j/4AAQ..."
        // We need to strip off the header.
        const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

        const imagePart = {
            inlineData: {
                data: base64Data,
                mimeType: mimeType || "image/jpeg"
            }
        };

        const result = await model.generateContent([prompt, imagePart]);
        const responseText = result.response.text();
        
        // Clean up markdown if Gemini returns it wrapped in ```json ... ```
        const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const jsonResult = JSON.parse(cleanedText);
        
        res.status(200).json(jsonResult);
    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ error: "Failed to analyze document. Please check the backend logs." });
    }
});

app.post('/api/lyrics', async (req, res) => {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        const { title, composer } = req.body;
        
        if (!title) return res.status(400).json({ error: "No song title provided" });

        const prompt = `Provide the public domain or common liturgical lyrics for the Catholic hymn "${title}" by ${composer || "unknown"}. Return only the lyrics separated by standard paragraphs, no markdown, no chords. If the exact lyrics are unknown, provide the closest known traditional lyrics or a brief summary of the song's liturgical use.`;
        
        const result = await model.generateContent(prompt);
        res.status(200).json({ lyrics: result.response.text() });
    } catch (error) {
        console.error("Lyrics AI Error:", error);
        res.status(500).json({ error: "Failed to fetch lyrics." });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
