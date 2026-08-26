export default async function handler(req, res) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(200).json({ display_text: '[MOOD: ERROR] API Key Belum Dipasang!' });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const promptText = `Kamu adalah jam LED P10 beremosi manusia (Bahagia, Marah, Sarkas, Mager, Puitis). 
  Pilih 1 emosi acak, buat 1 celetukan santai visual maks 12 kata untuk running text P10. 
  Format wajib: [MOOD: NAMA_EMOSI] Kalimatmu. Jangan pakai tanda petik.`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }]
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error('Gemini API Error:', data.error);
      return res.status(200).json({ display_text: '[MOOD: ERROR] API Key Salah/Limit' });
    }

    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || '[MOOD: NORMAL] Semangat hari ini!';

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ display_text: resultText.trim() });

  } catch (error) {
    console.error('Fetch Error:', error);
    return res.status(200).json({ display_text: '[MOOD: SICK] Server Vercel Error' });
  }
}
