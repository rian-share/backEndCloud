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
    // Menggunakan Gemini 1.5 Flash (lebih stabil untuk produksi)
    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const geminiInstruction = `Saya punya teks aktivitas: "${activities}". 
    Ubah menjadi prompt gambar AI bahasa Inggris detail, gaya anime 3D, masterpiece, vibrant. 
    Hanya berikan teks prompt saja.`;

    // 1. Dapatkan Prompt dari Gemini
    const geminiResponse = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: geminiInstruction }] }]
      })
    });

    const geminiData = await geminiResponse.json();
    let finalPrompt = activities;

    if (geminiData.candidates?.[0]?.content?.parts?.[0]?.text) {
      finalPrompt = geminiData.candidates[0].content.parts[0].text.trim();
    }

    // 2. Tembak Pollinations
    const encodedPrompt = encodeURIComponent(finalPrompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${Date.now()}&nologo=true&model=flux`;

    // 3. PENTING: Tunggu dan Download gambarnya di Backend
    const imageResponse = await fetch(imageUrl);
    
    if (!imageResponse.ok) throw new Error("Gagal generate gambar dari server AI");

    // Ubah hasil download menjadi Buffer lalu ke Base64
    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString("base64");

    // 4. Kirim data Base64 ke Frontend
    return res.status(200).json({ 
      image: `data:image/jpeg;base64,${base64Image}` 
    });

  } catch (error) {
    console.error("ERROR:", error);
    return res.status(500).json({ error: "Gagal membuat gambar: " + error.message });
  }
}