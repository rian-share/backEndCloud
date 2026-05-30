export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Gunakan method POST" });

  const { activities } = req.body;
  if (!activities) return res.status(400).json({ error: "Data aktivitas kosong" });

  try {
    // URL diperbarui ke v1 dan menggunakan model gemini-pro yang lebih stabil ketersediaannya
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const prompt = `Pengguna melakukan aktivitas: "${activities}". 
    Berdasarkan itu, berikan:
    1. Satu rekomendasi aktivitas selanjutnya yang seimbang.
    2. Tanggapan ramah.
    Balas WAJIB dalam format JSON murni:
    {
      "rekomendasi": "isi di sini",
      "tanggapan": "isi di sini"
    }`;

    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("Detail Error Gemini:", data);
      throw new Error(data.error?.message || "Gagal menghubungi Gemini");
    }

    // Mengambil teks dari respon Gemini
    let resultText = data.candidates[0].content.parts[0].text;
    
    // Membersihkan teks jika AI memberikan format markdown ```json ... ```
    resultText = resultText.replace(/```json|```/g, "").trim();

    return res.status(200).json(JSON.parse(resultText));

  } catch (error) {
    console.error("Log Error:", error.message);
    return res.status(500).json({ error: "Gagal memproses rekomendasi AI: " + error.message });
  }
}