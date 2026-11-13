import { NextResponse } from "next/navigation";
import { transcribeWithGnaniPrisma } from "@/lib/gnani";

export async function POST(request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    // If multipart/form-data with recorded audio
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const audioFile = formData.get("audio");
      const languageCode = formData.get("language") || "indic-auto";

      if (!audioFile) {
        return NextResponse.json({ success: false, error: "No audio file uploaded" }, { status: 400 });
      }

      // Call Gnani Prisma
      const result = await transcribeWithGnaniPrisma(audioFile, languageCode, audioFile.name || "voice_input.wav");

      if (result.success) {
        return NextResponse.json(result);
      }

      // If Gnani API key was not configured, indicate fallback to client
      return NextResponse.json({
        success: false,
        isConfigured: result.isConfigured,
        source: result.source,
        error: result.error,
        fallbackToBrowser: true,
      });
    }

    // JSON fallback (for passing pre-recorded demo audio snippet or direct transcription simulation)
    const body = await request.json();
    const { demoPreset, language = "ml-IN" } = body;

    if (demoPreset) {
      const presets = {
        "ponni_rice_add": "Ente kada-yil 10 kg Ponni rice undu",
        "ponni_rice_simple": "Add 10 kg Ponni rice",
        "sugar_add": "Ente kada-yil 5 packet sugar undu",
        "milk_reduce": "Reduce milk stock by 3",
        "coconut_oil_add": "Kada-yil 10 litre Kera coconut oil vannu",
        "atta_stock": "Aashirvaad atta stock 15 packet undu",
      };

      const transcript = presets[demoPreset] || "Ente kada-yil 10 kg Ponni rice undu";
      return NextResponse.json({
        success: true,
        isConfigured: false,
        transcript,
        model: "prisma-v3.0 (Demo Preset)",
        detectedLanguage: language,
        source: "demo_preset",
      });
    }

    return NextResponse.json({ success: false, error: "Unsupported request format" }, { status: 400 });
  } catch (error) {
    console.error("STT route error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
