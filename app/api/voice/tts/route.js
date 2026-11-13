import { NextResponse } from "next/navigation";
import { synthesizeWithGnaniTimbre } from "@/lib/gnani";

export async function POST(request) {
  try {
    const body = await request.json();
    const { text, language = "ml-IN", voice = "Nalini" } = body;

    if (!text) {
      return NextResponse.json({ success: false, error: "Text is required for TTS" }, { status: 400 });
    }

    // Call Gnani Timbre
    const result = await synthesizeWithGnaniTimbre(text, language, voice);

    if (result.success) {
      return NextResponse.json(result);
    }

    // Graceful fallback to client Web Speech Synthesis
    return NextResponse.json({
      success: false,
      isConfigured: result.isConfigured,
      source: result.source,
      error: result.error,
      fallbackToBrowser: true,
      textToSpeak: text,
      language: language === "ml-IN" ? "ml-IN" : "en-IN",
    });
  } catch (error) {
    console.error("TTS route error:", error);
    return NextResponse.json({
      success: false,
      error: error.message,
      fallbackToBrowser: true,
    }, { status: 500 });
  }
}
