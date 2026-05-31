export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Gunakan method POST" });

  const { activities } = req.body;
  if (!activities) return res.status(400).json({ error: "Data aktivitas kosong" });

  try {
    // 1. Siapkan API Key Gemini untuk teks
    const apiKey = process.env.GEMINI_API_KEY;
    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    // Instruksi ke Gemini: Terjemahkan dan percantik prompt-nya!
    const geminiInstruction = `Saya punya teks aktivitas dalam bahasa Indonesia: "${activities}". 
    Tolong ubah teks ini menjadi prompt gambar AI berbahasa Inggris yang sangat detail, estetik, bergaya anime 3D berkualitas tinggi (masterpiece, best quality, vibrant colors). 
    PENTING: Cukup berikan teks prompt bahasa Inggris-nya saja, jangan tambahkan penjelasan atau basa-basi apa pun.`;

    // 2. Minta Gemini memikirkan prompt-nya
    const geminiResponse = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: geminiInstruction }] }]
      })
    });

    const geminiData = await geminiResponse.json();
    
    // Fallback (jaga-jaga jika Gemini gagal, kita punya cadangan standar)
    let finalPrompt = `anime style picture of someone doing ${activities.replace(/[^a-zA-Z0-9 ]/g, "")}`;

    // Jika Gemini berhasil menjawab, gunakan jawaban canggihnya
    if (geminiData.candidates && geminiData.candidates.length > 0) {
      finalPrompt = geminiData.candidates[0].content.parts[0].text.trim();
    }

    // 3. Kirim prompt canggih berbahasa Inggris tersebut ke Pollinations
    const encodedPrompt = encodeURIComponent(finalPrompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${Date.now()}&nologo=true`;

    // Kirim URL gambar ke frontend
    return res.status(200).json({ image: imageUrl });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Gagal membuat gambar hybrid" });
  }
}