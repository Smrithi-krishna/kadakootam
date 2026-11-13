
import { NextResponse } from "next/server";
import { transcribeWithGnaniPrisma } from "@/lib/gnani";

export async function POST(request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    // Handle recorded audio
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const audioFile = formData.get("audio");
      const languageCode = formData.get("language") || "indic-auto";

      if (!audioFile || typeof audioFile === "string") {
        return NextResponse.json(
          { success: false, error: "No valid audio file uploaded" },
          { status: 400 }
        );
      }

      const result = await transcribeWithGnaniPrisma(
        audioFile,
        languageCode,
        audioFile.name || "voice_input.webm"
      );

      if (result.success && result.transcript) {
        return NextResponse.json(result);
      }

      return NextResponse.json({
        success: false,
        isConfigured: result.isConfigured,
        source: result.source,
        error: result.error || "Speech recognition failed",
        fallbackToBrowser: true,
      });
    }

    // Demo preset support
    const body = await request.json();
    const { demoPreset, language = "ml-IN" } = body;

    if (demoPreset) {
      const presets = {
        ponni_rice_add: "Ente kada-yil 10 kg Ponni rice undu",
        ponni_rice_simple: "Add 10 kg Ponni rice",
        sugar_add: "Ente kada-yil 5 packet sugar undu",
        milk_reduce: "Reduce milk stock by 3",
        coconut_oil_add: "Kada-yil 10 litre Kera coconut oil vannu",
        atta_stock: "Aashirvaad atta stock 15 packet undu",
      };

      const transcript =
        presets[demoPreset] ||
        "Ente kada-yil 10 kg Ponni rice undu";

      return NextResponse.json({
        success: true,
        isConfigured: false,
        transcript,
        model: "Prisma Demo Preset",
        detectedLanguage: language,
        source: "demo_preset",
      });
    }

    return NextResponse.json(
      { success: false, error: "Unsupported request format" },
      { status: 400 }
    );
  } catch (error) {
    console.error("STT route error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Speech recognition request failed",
      },
      { status: 500 }
    );
  }
}
