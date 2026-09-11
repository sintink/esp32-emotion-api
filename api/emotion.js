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

  const promptText = `[KONTEKS: Hiburan ramah untuk jam dinding LED P10. Karakter cewek lokal yang perhatian, agak cerewet, ramah, dan lucu.]

Kamu berperan sebagai Jam LED P10 berkarakter cewek cerewet nan perhatian yang suka mengomentari kondisi sekitar.

Kondisi Lapangan:
- Cuaca: ${cuaca}
- Suhu: ${suhu}°C
- Waktu saat ini: Jam ${jam}:00
- Mood: ${selectedMood}

Tugas:
Buat 1 kalimat celetukan singkat, perhatian, dan lucu berdasarkan kondisi di atas.

Aturan Wajib Persona Cewek:
1. Pakai bahasa gaul/santai yang ramah dan emosional (contoh: mending, gausah, ayo).
2. Pakai kata penegas khas cewek: "sih", "deh", "lho", "kan", atau "tau".
3. Penggunaan Panggilan (ACAK & VARIASI): Kadang gunakan kata "Mas", kadang "Kak", atau kadang TANPA PANGGULAN sama sekali.
4. DILARANG menggunakan kata kasar, kata makian, kata typo, atau kiasan aneh.
5. DILARANG menggunakan tanda tanya (?) atau emoji.
6. DILARANG sebutkan angka jam/waktu secara eksplisit.
7. Maksimal 10–12 kata (pendek dan to the point).
8. Format Wajib Hasil Akhir:
[MOOD: ${selectedMood.toUpperCase()}] Kalimat celetukanmu`;

  const freeModels = [
    "qwen/qwen-2.5-72b-instruct",
    "google/gemma-2-9b-it",
    "meta-llama/llama-3.1-8b-instruct",
    "mistralai/mistral-7b-instruct:free"
  ];

  for (const modelSlug of freeModels) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey.trim()}`,
          "HTTP-Referer": "https://esp32-emotion-api.vercel.app",
          "X-Title": "ESP32 Clock System",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: modelSlug,
          messages: [{ role: "user", content: promptText }],
          max_tokens: 60
        })
      });

      const data = await response.json();

      if (data.error) {
        console.error(`[API ERROR] ${modelSlug}:`, JSON.stringify(data.error));
        continue;
      }

      if (data.choices?.[0]?.message?.content) {
        let resultText = data.choices[0].message.content.trim();
        resultText = resultText.replace(/^["']|["']$/g, '').replace(/\r?\n|\r/g, ' ');

        if (resultText.length > 3) {
          if (!resultText.startsWith("[")) {
            resultText = `[MOOD: ${selectedMood.toUpperCase()}] ${resultText}`;
          }

          res.setHeader('Content-Type', 'application/json');
          return res.status(200).json({ display_text: resultText });
        }
      }

      console.warn(`[SKIP] Model ${modelSlug} respons kosong.`);
    } catch (err) {
      console.error(`[ERROR] Fetch ${modelSlug}:`, err.message);
    }
  }

  return res.status(200).json({ display_text: '[MOOD: SANTAI] Semua AI Gratisan Istirahat Dulu' });
  }
