// api/emotion.js — Vercel Serverless Function
// Endpoint: /api/emotion?cuaca=X&suhu=Y&jam=Z

export default async function handler(req, res) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return res.status(200).json({ display_text: '[MOOD: ERROR] API Key Belum Dipasang!' });
  }

  // ─── Input dari ESP32 ───
  const cuaca = req.query.cuaca || 'Cerah';
  const suhu  = req.query.suhu  || '30';
  const jam   = req.query.jam   || '12';

  // ─── Mood + Deskripsi ───
  const moodList = [
    'Sarkas', 'Sindiran', 'Mager', 'Semangat',
    'Puitis', 'Humor', 'Perhatian', 'Nostalgia',
    'Filsuf', 'Drama', 'Santai', 'Heran'
  ];

  const moodDesc = {
    'Sarkas':    'nada sinis tapi lucu, nyindir halus',
    'Sindiran':  'nyindir santai, gak frontal',
    'Mager':     'malas, pengen rebahan, ogah gerak',
    'Semangat':  'energik, nyemangatin, dorong semangat',
    'Puitis':    'berbunga-bunga, romantis, indah',
    'Humor':     'lucu ringan, bikin senyum',
    'Perhatian': 'peduli, mengingatkan hal baik',
    'Nostalgia': 'mengenang masa lalu, haru',
    'Filsuf':    'reflektif, merenung, dalam',
    'Drama':     'lebay tapi menghibur, teatrikal',
    'Santai':    'tenang, santuy, chill',
    'Heran':     'kaget, takjub, gak nyangka'
  };

  const selectedMood = moodList[Math.floor(Math.random() * moodList.length)];
  const descMood = moodDesc[selectedMood] || 'santai';

  // ─── Prompt ───
  const promptText = `Kamu jam LED P10 berkarakter cewek Indonesia yang cerewet, ramah, dan perhatian.

Konteks:
- Cuaca: ${cuaca}
- Suhu: ${suhu}°C
- Waktu saat ini: Jam ${jam}
- Mood: ${selectedMood} (${descMood})

ATURAN WAJIB:
1. Bahasa gaul cewek, ramah, santai (contoh: "mending", "gausah", "ayo")
2. Kata penegas khas cewek: "sih", "deh", "lho", "kan", "tau"
3. Panggilan acak: "Mas" / "Kak" / TANPA panggilan (jangan pakai dua-duanya sekaligus)
4. Maksimal 12 kata, pendek dan to the point
5. DILARANG pakai emoji
6. DILARANG pakai tanda tanya (?)
7. DILARANG sebut angka jam secara eksplisit (contoh: "jam 12")
8. DILARANG kata kasar, makian, atau typo
9. Output langsung 1 kalimat, tanpa penjelasan tambahan

CONTOH OUTPUT BENAR:
- [MOOD: SANTAI] Cuaca adem gini, enaknya rebahan sambil ngopi
- [MOOD: HERAN] Suhu 30 derajat, Mas, kok bisa sepanas ini
- [MOOD: MAGER] Males banget bergerak hari ini, Kak, pengen rebahan aja
- [MOOD: PUITIS] Langit mendung ini bikin hati ikut syahdu ya

CONTOH OUTPUT SALAH:
- Cuaca hari ini sangat cerah dan menyenangkan (terlalu formal, bukan bahasa cewek)
- Wah, panas ya? (ada tanda tanya)
- [MOOD: SANTAI] Mas Kak, cuaca adem ya (panggilan dobel)

Langsung jawab 1 kalimat dengan format: [MOOD: ${selectedMood.toUpperCase()}] kalimat celetukanmu`;

  // ─── Model List (prioritas dari paling kuat) ───
  const freeModels = [
    "qwen/qwen-2.5-72b-instruct",
    "meta-llama/llama-3.3-70b-instruct:free",
    "google/gemma-2-9b-it:free",
    "mistralai/mistral-7b-instruct:free"
  ];

  // ─── Coba model satu per satu ───
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
          max_tokens: 100,
          temperature: 0.8
        })
      });

      const data = await response.json();

      if (data.error) {
        console.error(`[API ERROR] ${modelSlug}:`, JSON.stringify(data.error));
        continue;
      }

      if (data.choices?.[0]?.message?.content) {
        let resultText = data.choices[0].message.content.trim();

        // Bersihkan tanda kutip & newline
        resultText = resultText
          .replace(/^["']|["']$/g, '')
          .replace(/\r?\n|\r/g, ' ')
          .trim();

        // Pastikan ada tag [MOOD: X] di depan
        if (!resultText.startsWith("[")) {
          resultText = `[MOOD: ${selectedMood.toUpperCase()}] ${resultText}`;
        }

        // Validasi minimal
        if (resultText.length > 5) {
          res.setHeader('Content-Type', 'application/json');
          return res.status(200).json({ display_text: resultText });
        }
      }

      console.warn(`[SKIP] Model ${modelSlug} respons kosong.`);
    } catch (err) {
      console.error(`[ERROR] Fetch ${modelSlug}:`, err.message);
    }
  }

  // Fallback kalau semua model gagal
  return res.status(200).json({
    display_text: '[MOOD: SANTAI] Semua AI Gratisan Istirahat Dulu'
  });
}
