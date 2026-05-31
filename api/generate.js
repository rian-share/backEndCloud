export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Gunakan method POST" });

  const { activities } = req.body;
  if (!activities) return res.status(400).json({ error: "Data aktivitas kosong" });

  try {
    // Ambil API Key dari Vercel Environment Variables
    const apiKey = process.env.GEMINI_API_KEY;
    
    // Endpoint khusus untuk model pembuat gambar (Imagen) dari Google
    const IMAGEN_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`;

    const prompt = `gaya anime seseorang yang sedang melakukan  ${activities}, high quality, detailed`;

    // Kirim permintaan (POST) ke server Google
    const response = await fetch(IMAGEN_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt: prompt }],
        parameters: { sampleCount: 1 } // Kita minta 1 gambar saja
      })
    });

    const data = await response.json();

    // Cek jika Google berhasil mengembalikan data gambar
    if (data.predictions && data.predictions.length > 0) {
      // Google mengirim gambar dalam format Base64, kita ubah jadi format URL Data
      const base64Image = data.predictions[0].bytesBase64Encoded;
      const imageUrl = `data:image/jpeg;base64,${base64Image}`;
      
      // Kirim ke frontend (frontend tetap bisa menampilkannya di tag <img src="...">)
      return res.status(200).json({ image: imageUrl });
    } else {
      // Jika terjadi error dari sisi Google (misalnya prompt ditolak)
      return res.status(500).json({ error: data.error?.message || "Google menolak membuat gambar ini." });
    }

  } catch (error) {
    return res.status(500).json({ error: "Gagal terhubung ke server Google" });
  }
}