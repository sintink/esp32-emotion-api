import { GoogleGenAI } from '@google/genai';

/**
 * Vercel Serverless Function - Gemini Emotion API Gateway for ESP32
 * 
 * @param {import('@vercel/node').VercelRequest} req 
 * @param {import('@vercel/node').VercelResponse} res 
 */
export default async function handler(req, res) {
  // Hanya izinkan method GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error('[ERROR] GEMINI_API_KEY is not defined in environment variables.');
    return res.status(500).json({ display_text: '[MOOD: ERROR] Config API Key Hilang!' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const promptText = `Kamu adalah jam LED P10 beremosi manusia (Bahagia, Marah, Sarkas, Mager, Puitis). 
    Pilih 1 emosi acak, buat 1 celetukan santai visual maks 12 kata untuk running text P10. 
    Format wajib: [MOOD: NAMA_EMOSI] Kalimatmu. Jangan pakai tanda petik.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptText,
    });

    const resultText = response.text?.trim() || '[MOOD: NORMAL] Semangat jalani hari ini!';

    // Set CORS & Content-Type Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-maxage=0, max-age=0, no-cache, no-store');

    return res.status(200).json({ 
      status: 'success',
      display_text: resultText 
    });

  } catch (error) {
    console.error('[GEMINI API ERROR]:', error.message || error);
    
    return res.status(500).json({ 
      status: 'error',
      display_text: '[MOOD: SICK] Server Gemini Sedang Pusing...' 
    });
  }
}
