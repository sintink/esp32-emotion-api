export default async function handler(req, res) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(200).json({ display_text: '[MOOD: ERROR] API Key Belum Dipasang!' });
  }

  // 1. Tangkap parameter dari ESP32
  const cuaca = req.query.cuaca || 'Cerah';
  const suhu = req.query.suhu || '30';
  const jam = req.query.jam || '12';

  // 2. Daftar 12 Mood Pilihan
  const listMood = [
    'Sarkas', 'Sindiran', 'Mager', 'Semangat', 
    'Puitis', 'Humor', 'Perhatian', 'Nostalgia', 
    'Filsuf', 'Drama', 'Santai', 'Heran'
  ];

  const selectedMood = listMood[Math.floor(Math.random() * listMood.length)];

  // 3. Gunakan model Gemini 2.5 Flash
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  // 4. Prompt dinamis
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
        contents: [{ parts: [{ text: promptText }] }],
        // Tambahkan Safety Settings agar prompt sinis/sarkas tidak terblokir filter Gemini
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" }
        ]
      })
    });

    const data = await response.json();

    // Cek error dari Google
    if (data.error) {
      console.error('Gemini API Error Detail:', JSON.stringify(data.error));
      // Tampilkan pesan error beserta kodenya agar mudah di-debug
      return res.status(200).json({ 
        display_text: `[MOOD: ERROR] Code ${data.error.code}: ${data.error.status}` 
      });
    }

    // Ambil teks dari response Gemini (menangani struktur output Gemini)
    const candidate = data.candidates?.[0];
    let resultText = '';

    if (candidate?.content?.parts) {
      // Cari part yang berisi teks respons
      const textPart = candidate.content.parts.find(p => p.text);
      if (textPart) {
        resultText = textPart.text;
      }
    }

    if (!resultText) {
      resultText = `[MOOD: ${selectedMood.toUpperCase()}] Mending lu jalan daripada ngeliatin gue terus.`;
    }

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ display_text: resultText.trim() });

  } catch (error) {
    console.error('Fetch Error:', error);
    return res.status(200).json({ display_text: '[MOOD: SICK] Server Vercel Error' });
  }
}
