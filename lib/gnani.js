// Official Gnani.ai API Adapter for KadaKootam (കടക്കൂട്ടം)
// Verified endpoints for Gnani Vachana platform:
// 1. Prisma (STT): POST https://api.vachana.ai/stt/v3
// 2. Timbre (TTS): POST https://api.vachana.ai/api/v1/tts/inference
// Authentication header: X-API-Key-ID: <GNANI_API_KEY>

const GNANI_BASE_URL = process.env.GNANI_BASE_URL || "https://api.vachana.ai";
const GNANI_API_KEY = process.env.GNANI_API_KEY || "";

// Audio transcription cache to avoid repeat calls for identical audio
const transcriptionCache = new Map();

/**
 * Transcribe audio using Gnani Prisma v3.0 STT API
 * @param {Blob | Buffer | File} audioBuffer - Audio data (wav/mp3/webm)
 * @param {string} [languageCode="indic-auto"] - 'indic-auto', 'ml-IN', or 'en-IN'
 * @param {string} [filename="audio.wav"]
 */
export async function transcribeWithGnaniPrisma(audioBuffer, languageCode = "indic-auto", filename = "audio.wav") {
  // If no API key configured, return clean status indicating mock/browser fallback mode
  if (!GNANI_API_KEY) {
    return {
      success: false,
      isConfigured: false,
      error: "GNANI_API_KEY is not configured in environment variables. Falling back to client-side Web Speech / manual audio mode.",
      transcript: null,
      source: "fallback_unconfigured"
    };
  }

  try {
    const formData = new FormData();
    const blob = audioBuffer instanceof Blob ? audioBuffer : new Blob([audioBuffer], { type: "audio/wav" });
    formData.append("audio_file", blob, filename);
    formData.append("model", "prisma-v3.0");
    formData.append("language_code", languageCode);

    const response = await fetch(`${GNANI_BASE_URL}/stt/v3`, {
      method: "POST",
      headers: {
        "X-API-Key-ID": GNANI_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Gnani Prisma API error (${response.status}):`, errText);
      return {
        success: false,
        isConfigured: true,
        status: response.status,
        error: `Gnani Prisma responded with status ${response.status}`,
        transcript: null,
        source: "gnani_error"
      };
    }

    const data = await response.json();
    return {
      success: true,
      isConfigured: true,
      transcript: data.transcript || "",
      model: data.model || "prisma-v3.0",
      detectedLanguage: data.detected_language_code || languageCode,
      processingTime: data.processing_time,
      requestId: data.request_id,
      source: "gnani_prisma"
    };
  } catch (error) {
    console.error("Gnani Prisma STT fetch failed:", error);
    return {
      success: false,
      isConfigured: true,
      error: error.message || "Failed to reach Gnani Prisma STT service",
      transcript: null,
      source: "gnani_network_error"
    };
  }
}

/**
 * Synthesize speech using Gnani Timbre TTS API
 * @param {string} text - Malayalam or English text to synthesize
 * @param {string} [language="ml-IN"] - Target language ('ml-IN', 'en-IN')
 * @param {string} [voice="Nalini"] - Synthetic voice name
 */
export async function synthesizeWithGnaniTimbre(text, language = "ml-IN", voice = "Nalini") {
  if (!GNANI_API_KEY) {
    return {
      success: false,
      isConfigured: false,
      error: "GNANI_API_KEY is not configured. Falling back to browser native Web Speech API synthesis.",
      audioBase64: null,
      source: "fallback_unconfigured"
    };
  }

  try {
    const payload = {
      text,
      voice,
      model: "timbre-v3.0",
      language,
      speed: 1.0,
      audio_config: {
        encoding: "linear_pcm",
        container: "wav",
        num_channels: 1,
        sample_rate: 24000,
        sample_width: 2,
      },
    };

    const response = await fetch(`${GNANI_BASE_URL}/api/v1/tts/inference`, {
      method: "POST",
      headers: {
        "X-API-Key-ID": GNANI_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Gnani Timbre API error (${response.status}):`, errText);
      return {
        success: false,
        isConfigured: true,
        status: response.status,
        error: `Gnani Timbre error ${response.status}`,
        audioBase64: null,
        source: "gnani_error"
      };
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    return {
      success: true,
      isConfigured: true,
      audioBase64: `data:audio/wav;base64,${base64}`,
      model: "timbre-v3.0",
      source: "gnani_timbre"
    };
  } catch (error) {
    console.error("Gnani Timbre TTS request failed:", error);
    return {
      success: false,
      isConfigured: true,
      error: error.message || "Failed to reach Gnani Timbre TTS service",
      audioBase64: null,
      source: "gnani_network_error"
    };
  }
}
