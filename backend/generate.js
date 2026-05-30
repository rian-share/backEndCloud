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
      Buat ilustrasi kartun/chibi yang lucu dan imut dari seorang mahasiswa yang hari ini melakukan: "${activities}".
      Gambar harus mencerminkan kepribadian atau suasana hati dari aktivitas tersebut. 
      Warna cerah, tanpa teks di dalam gambar, kualitas tinggi.
    `;

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        response_format: "b64_json"
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message);

    return res.status(200).json({ image: data.data[0].b64_json });

  } catch (error) {
    return res.status(500).json({ error: "Gagal membuat gambar AI" });
  }
}