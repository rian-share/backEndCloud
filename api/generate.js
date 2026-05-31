export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Gunakan method POST" });

  const { activities } = req.body;
  if (!activities) return res.status(400).json({ error: "Data aktivitas kosong" });

  try {
    // 1. Ambil Prompt dari Gemini (Sama seperti sebelumnya)
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;

    const geminiInstruction = `I have activity text: "${activities}". 
    Convert this to a very detailed, aesthetic, high-quality 3D anime style AI image prompt (masterpiece, vibrant colors). 
    IMPORTANT: Provide ONLY the English prompt text without any explanations.`;

    const geminiResponse = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: geminiInstruction }] }]
      })
    });

    const geminiData = await geminiResponse.json();
    let finalPrompt = `anime style, ${activities}`;

    if (geminiData.candidates && geminiData.candidates.length > 0) {
      finalPrompt = geminiData.candidates[0].content.parts[0].text.trim();
    }

    // 2. Kirim Prompt ke Hugging Face
    const HF_TOKEN = process.env.HF_TOKEN; // Simpan token hf_... di Environment Variables
    const HF_MODEL = "stabilityai/stable-diffusion-xl-base-1.0"; 

    const hfResponse = await fetch(
      `https://api-inference.huggingface.co/models/${HF_MODEL}`,
      {
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({ inputs: finalPrompt }),
      }
    );

    if (!hfResponse.ok) {
      const errorData = await hfResponse.text();
      console.error("Hugging Face Error:", errorData);
      throw new Error("Hugging Face sedang sibuk atau error");
    }

    // 3. Ubah data biner gambar menjadi Base64 agar bisa dikirim sebagai JSON
    const arrayBuffer = await hfResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString("base64");

    // Kirim data ke frontend
    return res.status(200).json({ 
      image: `data:image/jpeg;base64,${base64Image}`,
      prompt: finalPrompt // Opsional, untuk debug
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Gagal membuat gambar via Hugging Face" });
  }
}