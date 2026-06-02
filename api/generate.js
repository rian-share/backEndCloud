export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Gunakan method POST" });

  const { activities } = req.body;
  if (!activities) return res.status(400).json({ error: "Data aktivitas kosong" });

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("API Key Gemini belum diatur di Environment Variables");
    
    // Kita gunakan versi 3.0 yang menjadi standar stabil di AI Studio saat ini
    const MODEL_NAME = "imagen-3.0-generate-002"; 
    const GEMINI_IMAGEN_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateImages?key=${apiKey}`;

    const geminiResponse = await fetch(GEMINI_IMAGEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: activities,
        numberOfImages: 1,
        aspectRatio: "1:1",
        outputMimeType: "image/jpeg"
      })
    });

    // 1. Cek status HTTP Utama
    if (!geminiResponse.ok) {
      const errorHtmlOrText = await geminiResponse.text();
      throw new Error(`Google API Error (Status ${geminiResponse.status}): ${errorHtmlOrText}`);
    }

    // 2. Ambil sebagai TEKS MENTAH dulu (Kunci pencegah crash)
    const rawText = await geminiResponse.text();

    // 3. Cek apakah Google mengirim teks kosong
    if (!rawText || rawText.trim() === "") {
      throw new Error("Google mengembalikan status 200 OK, tetapi badannya KOSONG. Ini biasanya tanda bahwa wilayah/region akun kamu belum mendukung API Imagen, atau limit kuota harian habis tanpa pesan error resmi.");
    }

    // 4. Baru kita coba parse secara aman
    let geminiData;
    try {
      geminiData = JSON.parse(rawText);
    } catch (parseError) {
      throw new Error(`Gagal membaca format JSON. Respon mentah dari Google: ${rawText.substring(0, 300)}`);
    }

    const base64Image = geminiData.generatedImages?.[0]?.image?.imageBytes;

    if (!base64Image) {
      throw new Error("Gambar tidak ditemukan di dalam respon Google. Prompt mungkin terkena Safety Filter.");
    }

    return res.status(200).json({
      image: `data:image/jpeg;base64,${base64Image}`
    });

  } catch (error) {
    console.error("LOG ERROR LENGKAP:", error);
    return res.status(500).json({ error: error.message });
  }
}