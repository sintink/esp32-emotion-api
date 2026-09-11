export default async function handler(req, res) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return res.status(200).json({ display_text: '[MOOD: ERROR] API Key Belum Dipasang!' });
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

  const promptText = `[KONTEKS: Ini adalah permainan karakter komedi/hiburan untuk jam dinding LED P10. Semua kalimat bersifat candaan, sarkas, dan fiktif.]

Kamu berperan sebagai Karakter Jam LED P10 yang suka memberikan celetukan sinis, julit, lucu, dan santai.

Kondisi Lapangan:
- Cuaca: ${cuaca}
- Suhu: ${suhu}°C
- Waktu saat ini: Jam ${jam}:00
- Mood: ${selectedMood}

Tugas:
Buat 1 kalimat celetukan singkat, sinis, dan lucu berdasarkan kondisi di atas.

Aturan Wajib:
1. Pakai bahasa gaul/santai yang umum dan gampang dipahami orang awam (contoh: lu, gue, mending, emang, gausah).
2. DILARANG menggunakan kata kiasan absurd/aneh, slang yang membingungkan, atau kata typo.
3. DILARANG menggunakan tanda tanya (?) atau emoji.
4. DILARANG sebutkan angka jam/waktu secara eksplisit.
5. Maksimal 10–12 kata (pendek dan to the point).
6. Format Wajib Hasil Akhir:
[MOOD: ${selectedMood.toUpperCase()}] Kalimat celetukanmu`;

  // Model gratisan terstabil untuk Bahasa Indonesia
  const freeModels = [
    "qwen/qwen-2.5-72b-instruct:free",
    "google/gemma-2-9b-it:free",
    "meta-llama/llama-3.1-8b-instruct:free",
    "openrouter/free"
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

      if (data.choices?.[0]?.message?.content) {
        let resultText = data.choices[0].message.content.trim();

        // 1. Bersihkan tanda kutip ganda/tunggal di awal & akhir jika ada
        resultText = resultText.replace(/^["']|["']$/g, '');

        // 2. Cek apakah ini pesan error/metadata safety murni
        const isSafetyError = resultText.toLowerCase().includes("user safety:") || 
                              resultText.toLowerCase().includes("safety check");

        // 3. Jika bukan error safety dan punya isi teks yang cukup
        if (!isSafetyError && resultText.length > 3) {
          // Jika AI lupa menyertakan format [MOOD: ...], tambahkan otomatis
          if (!resultText.startsWith("[")) {
            resultText = `[MOOD: ${selectedMood.toUpperCase()}] ${resultText}`;
          }

          res.setHeader('Content-Type', 'application/json');
          return res.status(200).json({ display_text: resultText });
        }
      }

      console.warn(`[SKIP] Model ${modelSlug} respons ditolak filter.`);
    } catch (err) {
      console.error(`[ERROR] Fetch ${modelSlug}:`, err.message);
    }
  }

  return res.status(200).json({ display_text: '[MOOD: MINGGAT] Semua AI Gratisan Offline' });
}
