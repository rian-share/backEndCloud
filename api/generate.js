export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Gunakan method POST" });

  const { activities } = req.body;
  if (!activities) return res.status(400).json({ error: "Data aktivitas kosong" });

  try {
    // Kembali ke v1beta dengan model 1.5-flash (versi terbaru paling stabil untuk gratisan)
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const prompt = `Berikan rekomendasi aktivitas selanjutnya berdasarkan log ini: "${activities}". 
    Balas harus dalam format JSON murni:
    {
      "rekomendasi": "isi di sini",
      "tanggapan": "isi di sini"
    }`;

    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        // Memaksa model untuk memberikan output JSON jika didukung
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || "Gagal menghubungi Gemini");
    }

    // Mengambil teks respon
    let resultText = data.candidates[0].content.parts[0].text;
    
    // Pembersihan ekstra: menghapus markdown ```json dan ``` jika ada
    resultText = resultText.replace(/```json/g, "").replace(/```/g, "").trim();

    return res.status(200).json(JSON.parse(resultText));

  } catch (error) {
    console.error("Log Error:", error.message);
    return res.status(500).json({ error: "Gagal memproses rekomendasi AI: " + error.message });
  }
}