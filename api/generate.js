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
    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const geminiInstruction = `Terjemahkan aktivitas "${activities}" menjadi satu kalimat deskripsi gambar dalam bahasa Inggris (tanpa kata 'buatkan saya gambar'). Berikan bahasa Inggrisnya saja, tanpa basa-basi dan tanpa tanda kutip!`;

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
      let rawText = geminiData.candidates[0].content.parts[0].text.trim();
      finalPrompt = rawText.replace(/^["']|["']$/g, '');
    }

    // 2. Buat URL Pollinations (Rekomendasi: Hapus model=flux agar antrean lebih longgar)
    const encodedPrompt = encodeURIComponent(finalPrompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${Date.now()}&nologo=true`;

    // 3. LANGSUNG KIRIM URL NYA (Tanpa download di backend)
    return res.status(200).json({
      success: true,
      url: imageUrl
    });

  } catch (error) {
    console.error("ERROR:", error);
    return res.status(500).json({ error: "Gagal memproses prompt: " + error.message });
  }
}