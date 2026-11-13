
import { NextResponse } from "next/server";
import { parseShopkeeperVoiceIntent } from "@/lib/voice-intent-parser";

export async function POST(request) {
  try {
    const body = await request.json();
    const { transcript, inventory = [] } = body;

    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json(
        { success: false, error: "Transcript is required" },
        { status: 400 }
      );
    }

    const intent = parseShopkeeperVoiceIntent(transcript, inventory);
    return NextResponse.json(intent);
  } catch (error) {
    console.error("Parse route error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to parse voice command" },
      { status: 500 }
    );
  }
}
