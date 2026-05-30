export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Gunakan method POST" });

  const { activities } = req.body;
  if (!activities) return res.status(400).json({ error: "Data aktivitas kosong" });

  try {
    // Membuat prompt gambar yang optimal
    const imagePrompt = encodeURIComponent(`cute chibi student doing ${activities}, high quality, bright colors, 2d cartoon style`);
    const imageUrl = `https://pollinations.ai/p/${imagePrompt}?width=1024&height=1024&seed=${Date.now()}&nologo=true`;

    // Mengambil gambar dan mengubahnya ke Base64 agar cocok dengan frontend kamu
    const imageResponse = await fetch(imageUrl);
    const arrayBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');

    return res.status(200).json({ image: base64Image });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Gagal membuat gambar AI" });
  }
}