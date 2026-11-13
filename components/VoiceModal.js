
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useKada } from "@/lib/store";
import {
  Mic,
  MicOff,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  X,
  Play,
  Loader2,
} from "lucide-react";
import confetti from "canvas-confetti";

export default function VoiceModal({
  isOpen,
  onClose,
  initialMode = "shopkeeper",
  onCustomerSearch = null,
}) {
  const {
    currentShop,
    currentShopInventory,
    applyVoiceStockUpdate,
    language,
  } = useKada();

  const isMl = language === "ml";

  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [parsedIntent, setParsedIntent] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [activeTab, setActiveTab] = useState("mic");
  const [gnaniSource, setGnaniSource] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const browserTranscriptRef = useRef("");

  const shopkeeperPresets = [
    {
      title: "Ente kada-yil 10 kg Ponni rice undu",
      titleMl: "എന്റെ കടയിൽ 10 kg പൊന്നി അരി ഉണ്ട്",
      tag: "Main Demo Workflow",
      text: "Ente kada-yil 10 kg Ponni rice undu",
      desc: "Sets Ponni rice stock to 10 kg",
    },
    {
      title: "Add 10 kg Ponni rice",
      titleMl: "Add 10 kg Ponni rice",
      tag: "English Quick Add",
      text: "Add 10 kg Ponni rice",
      desc: "Increases Ponni rice by 10 kg",
    },
    {
      title: "Ente kada-yil 5 packet sugar undu",
      titleMl: "എന്റെ കടയിൽ 5 പാക്കറ്റ് പഞ്ചസാര ഉണ്ട്",
      tag: "Code-mixed Manglish",
      text: "Ente kada-yil 5 packet sugar undu",
      desc: "Updates sugar stock to 5 packets",
    },
    {
      title: "Reduce milk stock by 3",
      titleMl: "Reduce milk stock by 3",
      tag: "Stock Reduction",
      text: "Reduce milk stock by 3",
      desc: "Reduces milk stock by 3 packets",
    },
    {
      title: "Kada-yil 10 litre Kera coconut oil vannu",
      titleMl: "കടയിൽ 10 ലിറ്റർ കേര വെളിച്ചെണ്ണ വന്നു",
      tag: "Restock Malayalam",
      text: "Kada-yil 10 litre Kera coconut oil vannu",
      desc: "Adds 10 L coconut oil",
    },
  ];

  const customerPresets = [
    {
      title: "Where can I get Ponni rice?",
      titleMl: "പൊന്നി അരി എവിടെ കിട്ടും?",
      tag: "Main Customer Query",
      text: "Where can I get Ponni rice?",
    },
    {
      title: "Milma milk unda?",
      titleMl: "മിൽമ പാൽ ഉണ്ടോ?",
      tag: "Manglish Query",
      text: "Milma milk unda?",
    },
    {
      title: "Find Kera coconut oil near me",
      titleMl: "വെളിച്ചെണ്ണ എവിടെ കിട്ടും?",
      tag: "Local Discovery",
      text: "Find Kera coconut oil near me",
    },
  ];

  // Browser speech recognition fallback
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      recognitionRef.current = null;
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = isMl ? "ml-IN" : "en-IN";

    recognition.onresult = (event) => {
      let finalText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalText += text;
        }
      }

      if (finalText.trim()) {
        browserTranscriptRef.current = finalText.trim();
        setTranscript(finalText.trim());
      }
    };

    recognition.onerror = (event) => {
      console.warn("Browser SpeechRecognition:", event.error);
    };

    recognition.onend = () => {
      // Do not stop the audio recorder here.
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch (_) {}

      recognitionRef.current = null;
    };
  }, [isMl]);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setTranscript("");
      setParsedIntent(null);
      setIsSuccess(false);
      setStatusMessage("");
      setGnaniSource(null);
      setActiveTab("mic");
      browserTranscriptRef.current = "";
    }
  }, [isOpen]);

  // Start recording
  const startRecording = async () => {
    try {
      setTranscript("");
      setParsedIntent(null);
      setIsSuccess(false);
      setGnaniSource(null);
      browserTranscriptRef.current = "";
      audioChunksRef.current = [];

      setStatusMessage(
        isMl
          ? "സംസാരിക്കൂ... കേൾക്കുന്നുണ്ട്"
          : "Listening... speak now"
      );

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Microphone is not supported");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const mimeType = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
      ].find((type) => MediaRecorder.isTypeSupported(type));

      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        try {
          const actualMimeType =
            mediaRecorder.mimeType || "audio/webm";

          const extension = actualMimeType.includes("mp4")
            ? "mp4"
            : actualMimeType.includes("ogg")
              ? "ogg"
              : "webm";

          const audioBlob = new Blob(audioChunksRef.current, {
            type: actualMimeType,
          });

          stream.getTracks().forEach((track) => track.stop());

          if (audioBlob.size === 0) {
            setStatusMessage(
              "No audio recorded. Please try again."
            );
            return;
          }

          await processAudioWithGnani(
            audioBlob,
            `voice.${extension}`
          );
        } catch (error) {
          console.error("Recording processing error:", error);
          setStatusMessage("Could not process recorded audio.");
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event.error);
        stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
      };

      mediaRecorder.start();
      setIsRecording(true);

      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (error) {
          console.warn("Browser recognition could not start:", error);
        }
      }
    } catch (error) {
      console.error("Microphone access error:", error);

      setStatusMessage(
        isMl
          ? "മൈക്രോഫോൺ ലഭ്യമല്ല. ഡെമോ വാചകങ്ങൾ ഉപയോഗിക്കാം."
          : "Microphone unavailable. Please use a demo preset."
      );

      setActiveTab("presets");
      setIsRecording(false);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      setStatusMessage(
        isMl
          ? "ശബ്ദം പരിശോധിക്കുന്നു..."
          : "Analyzing speech..."
      );
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
  };

  // Send recorded audio to Gnani
  const processAudioWithGnani = async (blob, filename) => {
    setIsProcessing(true);

    try {
      const formData = new FormData();

      formData.append("audio", blob, filename);
      formData.append(
        "language",
        isMl ? "ml-IN" : "indic-auto"
      );

      const response = await fetch("/api/voice/stt", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      let recognizedText = "";

      if (data.success && data.transcript?.trim()) {
        recognizedText = data.transcript.trim();
        setGnaniSource("Gnani Prisma v3.0");
      } else if (browserTranscriptRef.current.trim()) {
        recognizedText = browserTranscriptRef.current.trim();
        setGnaniSource("Browser Speech Recognition");
      } else {
        setTranscript("");
        setStatusMessage(
          isMl
            ? "ശബ്ദം തിരിച്ചറിയാനായില്ല. വീണ്ടും ശ്രമിക്കുക."
            : data.error ||
                "Speech could not be recognized. Please try again or use a demo preset."
        );
        return;
      }

      setTranscript(recognizedText);

      await parseAndEvaluateIntent(recognizedText);
    } catch (error) {
      console.error("Audio processing failed:", error);

      if (browserTranscriptRef.current.trim()) {
        const fallbackText = browserTranscriptRef.current.trim();

        setTranscript(fallbackText);
        setGnaniSource("Browser Speech Recognition");

        await parseAndEvaluateIntent(fallbackText);
      } else {
        setStatusMessage(
          "Speech recognition failed. Please try again."
        );
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Demo preset selection
  const handleSelectPreset = async (presetText) => {
    setTranscript(presetText);
    setGnaniSource("Demo Preset");
    await parseAndEvaluateIntent(presetText);
  };

  // Parse voice intent
  const parseAndEvaluateIntent = async (textToParse) => {
    if (!textToParse?.trim()) return;

    if (initialMode === "customer") {
      if (onCustomerSearch) {
        onCustomerSearch(textToParse);
        onClose();
      }
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch("/api/voice/parse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcript: textToParse,
          inventory: currentShopInventory,
        }),
      });

      const parsed = await response.json();

      setParsedIntent(parsed);

      if (parsed.success) {
        setStatusMessage(
          isMl
            ? "ഉദ്ദേശ്യം തിരിച്ചറിഞ്ഞു. ദയവായി സ്ഥിരീകരിക്കുക."
            : "Intent recognized! Please review and confirm."
        );
      } else {
        setStatusMessage(
          isMl
            ? "സാധനത്തിന്റെ പേര് തിരിച്ചറിയാനായില്ല."
            : "Could not identify matching product in shop catalog."
        );
      }
    } catch (error) {
      console.error("Parse error:", error);
      setStatusMessage("Failed to process voice command.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Confirm stock update
  const handleConfirmStockUpdate = () => {
    if (!parsedIntent?.success) return;

    const success = applyVoiceStockUpdate(parsedIntent);

    if (success) {
      setIsSuccess(true);

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#b88147", "#16b364", "#099250"],
      });

      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-amber-200 overflow-hidden my-auto animate-in zoom-in-95">

        {/* Header */}
        <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-amber-100">
              <Mic className="w-5 h-5" />
            </div>

            <div>
              <h2 className="text-lg font-black tracking-tight">
                {initialMode === "shopkeeper"
                  ? isMl
                    ? "ശബ്ദത്തിലൂടെ സ്റ്റോക്ക് മാറ്റുക"
                    : "Voice Stock Update"
                  : isMl
                    ? "ശബ്ദത്തിലൂടെ സാധനങ്ങൾ തിരയുക"
                    : "Voice Product Search"}
              </h2>

              <div className="text-xs text-amber-200/90 font-medium">
                Powered by Gnani Prisma STT
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-amber-50 px-5 py-2.5 border-b border-amber-200 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("mic")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                activeTab === "mic"
                  ? "bg-amber-800 text-white"
                  : "bg-white text-amber-900 border border-amber-200"
              }`}
            >
              <Mic className="w-3.5 h-3.5 inline mr-1" />
              Live Mic
            </button>

            <button
              onClick={() => setActiveTab("presets")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                activeTab === "presets"
                  ? "bg-amber-800 text-white"
                  : "bg-white text-amber-900 border border-amber-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 inline mr-1" />
              Demo Presets
            </button>
          </div>

          <div className="text-[11px] font-semibold text-amber-800">
            {initialMode === "shopkeeper"
              ? isMl
                ? currentShop.nameMl
                : currentShop.name
              : ""}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">

          {isSuccess ? (
            <div className="py-8 text-center">
              <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto mb-4" />

              <h3 className="text-xl font-bold text-gray-900">
                {isMl
                  ? "സ്റ്റോക്ക് വിജയകരമായി പുതുക്കി!"
                  : "Stock Successfully Updated!"}
              </h3>

              <p className="text-sm text-gray-600 mt-2">
                {isMl
                  ? "ഇൻവെന്ററി സേവ് ചെയ്തു."
                  : "Your inventory has been updated."}
              </p>
            </div>
          ) : activeTab === "mic" ? (
            <div className="text-center py-4">

              {/* Microphone */}
              <div className="relative inline-block mb-6">
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isProcessing}
                  className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full flex flex-col items-center justify-center shadow-xl ${
                    isRecording
                      ? "bg-red-600 text-white ring-8 ring-red-200"
                      : "bg-gradient-to-tr from-amber-600 to-amber-700 text-white ring-4 ring-amber-200"
                  }`}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="w-12 h-12 mb-1" />
                      <span className="text-xs font-black">STOP</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-12 h-12 mb-1" />
                      <span className="text-xs font-black">SPEAK</span>
                    </>
                  )}
                </button>
              </div>

              {/* Status */}
              <div className="min-h-[28px] mb-4">
                {isRecording ? (
                  <p className="text-red-600 font-bold text-sm animate-pulse">
                    Recording... speak now
                  </p>
                ) : isProcessing ? (
                  <div className="flex items-center justify-center gap-2 text-amber-800">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">
                      {statusMessage || "Processing speech..."}
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">
                    Speak in Malayalam, English, or Manglish.
                  </p>
                )}
              </div>

              {/* Transcript */}
              {transcript && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left mb-4">
                  <div className="text-xs text-amber-800 font-bold mb-1">
                    Recognized Speech (Transcript)
                    {gnaniSource && (
                      <span className="ml-2 text-[10px]">
                        ({gnaniSource})
                      </span>
                    )}
                  </div>

                  <p className="text-base font-bold text-amber-950 italic">
                    "{transcript}"
                  </p>
                </div>
              )}

              {statusMessage && !isProcessing && (
                <p className="text-xs text-gray-600">
                  {statusMessage}
                </p>
              )}
            </div>
          ) : (
            /* Demo Presets */
            <div className="space-y-2.5 py-1">
              <p className="text-xs font-semibold text-gray-500 mb-2">
                Select a demo command:
              </p>

              {(initialMode === "shopkeeper"
                ? shopkeeperPresets
                : customerPresets
              ).map((preset, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectPreset(preset.text)}
                  disabled={isProcessing}
                  className="w-full text-left p-3 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 transition flex items-center justify-between"
                >
                  <div>
                    <span className="text-[10px] font-bold text-amber-800">
                      {preset.tag}
                    </span>

                    <div className="text-xs font-bold text-gray-900">
                      {isMl ? preset.titleMl : preset.title}
                    </div>

                    {preset.desc && (
                      <div className="text-[11px] text-gray-500">
                        {preset.desc}
                      </div>
                    )}
                  </div>

                  <Play className="w-4 h-4 text-amber-700" />
                </button>
              ))}
            </div>
          )}

          {/* Confirmation */}
          {parsedIntent &&
            !isSuccess &&
            initialMode === "shopkeeper" && (
              <div className="mt-4 border-2 border-amber-400 bg-amber-50 rounded-2xl p-4">

                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-amber-200">
                  <AlertCircle className="w-5 h-5 text-amber-700" />

                  <h4 className="text-sm font-black text-amber-950">
                    Verify Proposed Stock Change
                  </h4>
                </div>

                {parsedIntent.success ? (
                  <div className="space-y-3">

                    <div className="p-3 bg-white rounded-xl border border-amber-200 text-sm font-bold text-amber-950">
                      {isMl
                        ? parsedIntent.explanationMl
                        : parsedIntent.explanationEn}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white p-2 rounded-xl border border-amber-200">
                        <div className="text-[10px] text-gray-500 font-bold">
                          Current Stock
                        </div>

                        <div className="text-base font-bold">
                          {parsedIntent.currentStock} {parsedIntent.unit}
                        </div>
                      </div>

                      <div className="bg-amber-100 p-2 rounded-xl border border-amber-300">
                        <div className="text-[10px] text-amber-800 font-bold">
                          Action
                        </div>

                        <div className="text-xs font-black">
                          {parsedIntent.action}{" "}
                          {parsedIntent.quantity} {parsedIntent.unit}
                        </div>
                      </div>

                      <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-300">
                        <div className="text-[10px] text-emerald-800 font-bold">
                          New Stock
                        </div>

                        <div className="text-base font-black text-emerald-800">
                          {parsedIntent.proposedStock} {parsedIntent.unit}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => setParsedIntent(null)}
                        className="flex-1 py-3 px-4 rounded-xl border bg-white text-gray-700 font-bold text-sm"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={handleConfirmStockUpdate}
                        className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        Confirm & Update
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-red-700 font-medium">
                    Product could not be identified. Please try another command.
                  </div>
                )}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
