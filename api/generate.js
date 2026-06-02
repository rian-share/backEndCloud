export default async function handler(req, res) {
  // ==========================================
  // 1. ATURAN CORS & VALIDASI METHOD
  // ==========================================
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Gunakan method POST" });

  const { activities } = req.body;
  if (!activities) return res.status(400).json({ error: "Data aktivitas kosong" });

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    // URL Endpoint khusus untuk Gemini Imagen (menggunakan :generateImages, bukan :generateContent)
    const GEMINI_IMAGEN_URL = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:generateImages?key=${apiKey}`;

    // ==========================================
    // 2. TEMBAK API GEMINI IMAGEN LANGSUNG
    // ==========================================
    const geminiResponse = await fetch(GEMINI_IMAGEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: activities,
        numberOfImages: 1,
        aspectRatio: "1:1",          // Pilihan: "1:1", "3:4", "4:3", "9:16", "16:9"
        outputMimeType: "image/jpeg" // Pilihan: "image/jpeg" atau "image/png"
      })
    });

    const geminiData = await geminiResponse.json();

    // Cek jika ada error dari sistem internal API Gemini
    if (geminiData.error) {
      throw new Error(geminiData.error.message || "Terjadi kesalahan pada API Gemini.");
    }

    // Mengambil data base64 langsung dari struktur json Imagen
    const base64Image = geminiData.generatedImages?.[0]?.image?.imageBytes;

    if (!base64Image) {
      throw new Error("Gagal mendapatkan gambar. Pastikan prompt kamu aman (tidak melanggar Safety Filter Gemini).");
    }

    // ==========================================
    // 3. KIRIM KEMBALI KE FRONTEND
    // ==========================================
    return res.status(200).json({
      image: `data:image/jpeg;base64,${base64Image}`
    });

  } catch (error) {
    console.error("ERROR IMAGEN:", error);
    return res.status(500).json({ error: "Gagal membuat gambar: " + error.message });
  }
}