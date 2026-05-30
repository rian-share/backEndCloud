export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Gunakan method POST" });

  const { activities } = req.body;
  if (!activities) return res.status(400).json({ error: "Data aktivitas kosong" });

  try {
    // Tambahkan .jpg di akhir prompt agar Pollinations mengirim file GAMBAR, bukan halaman web
    const cleanActivity = activities.replace(/[^a-zA-Z0-9 ]/g, ""); // bersihkan karakter aneh
    const imagePrompt = encodeURIComponent(`cute chibi student doing ${cleanActivity} high quality`);
    
    // Gunakan format URL ini:
    const imageUrl = `https://image.pollinations.ai/p/${imagePrompt}.jpg?width=1024&height=1024&seed=${Date.now()}&nologo=true`;

    // Kirim URL-nya saja ke frontend
    return res.status(200).json({ image: imageUrl });

  } catch (error) {
    return res.status(500).json({ error: "Gagal membuat URL gambar" });
  }
}