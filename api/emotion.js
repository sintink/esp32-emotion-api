export default async function handler(req, res) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(200).json({ display_text: '[MOOD: ERROR] API Key Belum Dipasang!' });
  }

  // 1. Tangkap parameter dari ESP32 (URL: /api/emotion?cuaca=Hujan&suhu=24&jam=14)
  const cuaca = req.query.cuaca || 'Cerah';
  const suhu = req.query.suhu || '30';
  const jam = req.query.jam || '12';

  // 2. Daftar 12 Mood Pilihan (Termasuk Sindiran)
  const listMood = [
    'Sarkas', 'Sindiran', 'Mager', 'Semangat', 
    'Puitis', 'Humor', 'Perhatian', 'Nostalgia', 
    'Filsuf', 'Drama', 'Santai', 'Heran'
  ];

  // Pick 1 mood secara acak
  const selectedMood = listMood[Math.floor(Math.random() * listMood.length)];

  // 3. Gunakan model gemini-1.5-flash
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  // 4. Prompt dinamis berbasis cuaca + mood acak
  const promptText = `Kamu adalah karakter Jam Running Text LED P10.
  
Data Real-time:
- Cuaca: ${cuaca}
- Suhu: ${suhu}°C
- Jam: ${jam}:00

Tugas:
Buat 1 celetukan santai dan unik berdasarkan data cuaca di atas dengan gaya/mood: "${selectedMood}".
Khusus jika mood "Sindiran", buat sindiran halus/lucu seputar jemuran, kemalasan, dompet, atau kelakuan manusia.

Aturan Penting:
1. Maksimal 12-15 kata.
2. JANGAN gunakan emoji atau tanda petik.
3. Format Wajib Output: [MOOD: ${selectedMood.toUpperCase()}] Kalimat celetukanmu.`;

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
