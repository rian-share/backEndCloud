export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Gunakan method POST" });

  const { activities } = req.body;
  if (!activities) return res.status(400).json({ error: "Data aktivitas kosong" });

  // 1. Cek apakah API Key terbaca oleh Vercel
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API Key Gemini tidak ditemukan. Cek Environment Variables Vercel!" });
  }

  try {
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const prompt = `Berikan rekomendasi aktivitas selanjutnya berdasarkan log ini: "${activities}". 
    Balas harus dalam format JSON murni tanpa awalan/akhiran apapun:
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

    // 2. Cek jika HTTP Response dari Google bukan 200 OK
    if (!response.ok) {
      throw new Error(data.error?.message || "Gagal menghubungi server Gemini.");
    }

    // 3. Cek struktur data dengan sangat hati-hati (mencegah crash karena safety rating)
    const candidate = data?.candidates?.[0];

    if (candidate?.finishReason === 'SAFETY') {
      throw new Error("Aktivitasmu terblokir filter keamanan Gemini.");
    }

    let resultText = candidate?.content?.parts?.[0]?.text;

    if (!resultText) {
      console.log("Response aneh dari Gemini:", JSON.stringify(data));
      throw new Error("Gemini tidak mengembalikan teks apa pun.");
    }

    // 4. Pembersihan string JSON (Jaga-jaga jika model ngeyel)
    resultText = resultText.replace(/```json/g, "").replace(/```/g, "").trim();

    // 5. Coba parse JSON dengan aman
    let parsedJson;
    try {
      parsedJson = JSON.parse(resultText);
    } catch (parseError) {
      console.error("Gagal Parsing JSON dari Teks:", resultText);
      throw new Error("Format JSON dari Gemini rusak.");
    }

    // Sukses!
    return res.status(200).json(parsedJson);

  } catch (error) {
    // Sekarang error.message akan menampilkan penyebab ASLI masalahnya
    console.error("Log Error Lengkap:", error.message);
    return res.status(500).json({ error: error.message });
  }
}