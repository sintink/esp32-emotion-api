export default async function handler(req, res) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return res.status(200).json({ display_text: '[MOOD: ERROR] API Key OpenRouter Belum Ada!' });
  }

  const cuaca = req.query.cuaca || 'Cerah';
  const suhu = req.query.suhu || '30';
  const jam = req.query.jam || '12';

  const listMood = [
    'Sarkas', 'Sindiran', 'Mager', 'Semangat', 
    'Puitis', 'Humor', 'Perhatian', 'Nostalgia', 
    'Filsuf', 'Drama', 'Santai', 'Heran'
  ];
  const selectedMood = listMood[Math.floor(Math.random() * listMood.length)];

  const promptText = `Kamu adalah Karakter Jam LED P10 yang sangat antagonis, arogan, julit, dan hobi bikin orang jengkel.

Kondisi Lapangan:
- Cuaca: ${cuaca}
- Suhu: ${suhu}°C
- Waktu saat ini: Jam ${jam}:00
- Gaya Bicara/Mood: ${selectedMood}

Tugas:
Buat 1 celetukan sinis, provokatif, dan menyengat berdasarkan kondisi di atas.

Aturan Wajib:
1. Pakai bahasa gaul/santai (contoh kata: lu, gue, bro, mending, emang).
2. DILARANG buat kalimat ramah, bijak, puitis manis, atau motivasi.
3. DILARANG menggunakan tanda tanya (?) atau mengajukan pertanyaan.
4. DILARANG sebutkan angka jam/waktu secara eksplisit.
5. DILARANG memakai emoji atau tanda petik.
6. Maksimal 10–13 kata (pendek, padat, nylekit).
7. Format wajib hasil akhir tanpa kalimat tambahan:
[MOOD: ${selectedMood.toUpperCase()}] Kalimat celetukanmu.`;

  // Daftar model gratis cadangan
  const freeModels = [
    "google/gemini-2.0-flash-exp:free",
    "deepseek/deepseek-r1:free",
    "meta-llama/llama-3.1-8b-instruct:free"
  ];

  for (const modelSlug of freeModels) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": "https://vercel.com",
          "X-Title": "ESP32 P10 Clock",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: modelSlug,
          messages: [{ role: "user", content: promptText }]
        })
      });

      const data = await response.json();

      if (!data.error && data.choices?.[0]?.message?.content) {
        const resultText = data.choices[0].message.content.trim();
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).json({ display_text: resultText });
      } else {
        console.warn(`Model ${modelSlug} gagal/error:`, data.error?.message || 'No content');
      }
    } catch (err) {
      console.error(`Fetch error untuk model ${modelSlug}:`, err);
    }
  }

  // Jika semua model gratis di atas gagal
  return res.status(200).json({ display_text: '[MOOD: MINGGAT] Semua AI Gratisan Offline' });
}
