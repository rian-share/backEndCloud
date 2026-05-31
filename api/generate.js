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
    
    // Kita gunakan model Imagen 4.0 yang kamu temukan di JSON tadi
    const IMAGEN_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`;

    // Prompt gambar (kamu bisa ubah ke bahasa Indonesia jika mau)
    const prompt = `anime style picture of someone doing ${activities}, high quality, detailed, vibrant colors`;

    const response = await fetch(IMAGEN_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [
          { prompt: prompt }
        ],
        parameters: { 
          sampleCount: 1 // Hanya buat 1 gambar untuk menghemat waktu & data
        }
      })
    });

    const data = await response.json();

    // Cek keberhasilan dari Google
    if (data.predictions && data.predictions.length > 0) {
      // Ambil kode Base64 gambar dan jadikan format URL
      const base64Image = data.predictions[0].bytesBase64Encoded;
      const imageUrl = `data:image/jpeg;base64,${base64Image}`;
      
      return res.status(200).json({ image: imageUrl });
    } else {
      console.error("Respon Google:", data);
      return res.status(500).json({ error: data.error?.message || "Google menolak membuat gambar ini." });
    }

  } catch (error) {
    console.error("Error Fetch:", error);
    return res.status(500).json({ error: "Gagal terhubung ke server Google" });
  }
}