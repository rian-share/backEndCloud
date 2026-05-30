export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Gunakan method POST" });

  const { activities } = req.body;
  if (!activities) return res.status(400).json({ error: "Data aktivitas kosong" });

  try {
    const prompt = `
      Pengguna telah melakukan aktivitas berikut hari ini: "${activities}".
      Berdasarkan aktivitas tersebut, berikan:
      1. Satu rekomendasi aktivitas selanjutnya yang seimbang (misal: jika lelah, sarankan istirahat).
      2. Tanggapan/alasan ramah mengapa kamu merekomendasikan hal tersebut.
      
      Balas dengan format JSON ketat seperti ini:
      {
        "rekomendasi": "isi rekomendasi di sini",
        "tanggapan": "isi tanggapan di sini"
      }
    `;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" } // Memaksa output berupa JSON
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message);

    const result = JSON.parse(data.choices[0].message.content);
    return res.status(200).json(result);

  } catch (error) {
    return res.status(500).json({ error: "Gagal memproses rekomendasi AI" });
  }
}