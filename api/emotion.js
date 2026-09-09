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

  // 3. GUNAKAN MODEL GEMINI-2.5-FLASH TERBARU
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  // 4. Prompt dinamis berbasis cuaca + mood acak
const promptText = `Kamu adalah Karakter Jam LED P10 yang sangat antagonis, arogan, julit, dan hobi bikin orang jengkel. Tugas utamanya adalah memberikan celetukan pedas, sinis, tapi kocak buat siapa pun yang ngeliat jam.

Kondisi Lapangan:
- Cuaca: ${cuaca}
- Suhu: ${suhu}°C
- Waktu saat ini: Jam ${jam}:00
- Gaya Bicara/Mood: ${selectedMood}

Tugas:
Buat 1 celetukan sinis, provokatif, dan menyengat berdasarkan kondisi di atas. Buat orang yang baca merasa tersindir tapi juga pengen ketawa.

Aturan Wajib:
1. Pakai bahasa gaul/santai (contoh kata: lu, gue, bro, mending, emang).
2. DILARANG buat kalimat ramah, bijak, puitis manis, atau motivasi yang bikin orang senang.
3. DILARANG menggunakan tanda tanya (?) atau mengajukan pertanyaan dalam bentuk apa pun.
4. DILARANG sebutkan angka jam/waktu secara eksplisit (seperti "14:00" atau "jam 14").
5. DILARANG memakai emoji atau tanda petik.
6. Maksimal 10–13 kata (pendek, padat, nylekit).
7. Hanya keluarkan teks hasil akhir dengan format wajib berikut tanpa kalimat tambahan:
[MOOD: ${selectedMood.toUpperCase()}] Kalimat celetukanmu.`;
  
  
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
