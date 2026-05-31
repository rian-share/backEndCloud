import dns from 'node:dns';
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { activities } = req.body;
  if (!activities) return res.status(400).json({ error: "Data kosong" });

  try {
    const HF_TOKEN = process.env.HF_TOKEN;
    const HF_MODEL = "Lykon/AnyLoRA";

    // Kita buat "Template Prompt" agar hasilnya tetap bergaya anime/bagus 
    // meskipun user cuma ngetik teks pendek.
    const enhancedPrompt = `High quality 3D anime style, vibrant colors, masterpiece, ${activities}, highly detailed, aesthetic background.`;

    const hfResponse = await fetch(
      "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5",
      {
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          inputs: enhancedPrompt,
          parameters: {
            negative_prompt: "blurry, bad quality, distorted, low resolution",
          }
        }),
      }
    );

    if (!hfResponse.ok) {
      const errorText = await hfResponse.text();
      // Jika error 503, berarti model sedang loading di server HF
      if (hfResponse.status === 503) {
        return res.status(503).json({ error: "Model sedang disiapkan, coba lagi dalam 30 detik." });
      }
      throw new Error(`HF Error: ${errorText}`);
    }

    const arrayBuffer = await hfResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString("base64");

    return res.status(200).json({
      image: `data:image/jpeg;base64,${base64Image}`
    });

  } catch (error) {
    console.error("LOG DETAIL ERROR:", error);

    // Kirim pesan error yang sangat spesifik ke Frontend
    return res.status(500).json({
      error: error.message,
      stack: error.stack,
      hint: "Cek apakah HF_TOKEN di Vercel sudah benar dan tanpa tanda kutip."
    });
  }
}