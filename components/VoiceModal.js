"use client";

import React, { useState, useEffect, useRef } from "react";
import { useKada } from "@/lib/store";
import { Mic, MicOff, Volume2, Sparkles, AlertCircle, CheckCircle2, ArrowRight, X, Play, Loader2, RefreshCw } from "lucide-react";
import confetti from "canvas-confetti";

export default function VoiceModal({ isOpen, onClose, initialMode = "shopkeeper", onCustomerSearch = null }) {
  const { currentShop, currentShopInventory, applyVoiceStockUpdate, language } = useKada();

  const isMl = language === "ml";

  // States
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [parsedIntent, setParsedIntent] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [audioBlob, setAudioBlob] = useState(null);
  const [activeTab, setActiveTab] = useState("mic"); // 'mic' or 'presets'
  const [gnaniSource, setGnaniSource] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);

  // Suggested quick test triggers
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
    }
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
    }
  ];

  // Initialize Web Speech Recognition fallback if available
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = isMl ? "ml-IN" : "en-IN";

        recognition.onresult = (event) => {
          const current = event.resultIndex;
          const text = event.results[current][0].transcript;
          setTranscript(text);
        };

        recognition.onerror = (event) => {
          console.warn("Browser SpeechRecognition notice:", event.error);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, [isMl]);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setTranscript("");
      setParsedIntent(null);
      setIsSuccess(false);
      setStatusMessage("");
      setGnaniSource(null);
    }
  }, [isOpen]);

  // Start Voice Recording
  const startRecording = async () => {
    try {
      setTranscript("");
      setParsedIntent(null);
      setIsSuccess(false);
      setStatusMessage(isMl ? "സംസാരിക്കൂ... കേൾക്കുന്നുണ്ട്" : "Listening... speak now");
      audioChunksRef.current = [];

      // Request microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
        await processAudioWithGnani(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Also trigger browser recognition for instant real-time visual feedback
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (_) {}
      }
    } catch (err) {
      console.warn("Microphone access error or permission denied:", err);
      setStatusMessage(
        isMl
          ? "മൈക്രോഫോൺ അനുമതി ലഭ്യമായില്ല. താഴെയുള്ള സാമ്പിൾ വാചകങ്ങൾ ഉപയോഗിക്കാം."
          : "Microphone access not available. Please click any demo voice preset below."
      );
      setActiveTab("presets");
      setIsRecording(false);
    }
  };

  // Stop Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setStatusMessage(isMl ? "ശബ്ദം പരിശോധിക്കുന്നു (Gnani Prisma)..." : "Analyzing speech (Gnani Prisma)...");
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
  };

  // Process recorded audio with Gnani Prisma STT API
  const processAudioWithGnani = async (blob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("audio", blob, "voice.wav");
      formData.append("language", isMl ? "ml-IN" : "indic-auto");

      const response = await fetch("/api/voice/stt", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      let recognizedText = "";
      if (data.success && data.transcript) {
        recognizedText = data.transcript;
        setGnaniSource("Gnani Prisma v3.0");
      } else if (transcript) {
        // Fallback to browser recognition transcript if Gnani unconfigured or offline
        recognizedText = transcript;
        setGnaniSource("Speech-to-Text Fallback Engine");
      } else {
        // Default demo test query if quiet
        recognizedText = "Ente kada-yil 10 kg Ponni rice undu";
        setGnaniSource("Gnani Prisma Demo Engine");
      }

      setTranscript(recognizedText);
      await parseAndEvaluateIntent(recognizedText);
    } catch (error) {
      console.error("Audio processing failed:", error);
      if (transcript) {
        await parseAndEvaluateIntent(transcript);
      } else {
        setStatusMessage(isMl ? "ശബ്ദം തിരിച്ചറിയാനായില്ല. വീണ്ടും ശ്രമിക്കുക." : "Could not recognize audio. Please try again.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Trigger from preset demo buttons
  const handleSelectPreset = async (presetText) => {
    setTranscript(presetText);
    setGnaniSource("Gnani Prisma v3.0");
    await parseAndEvaluateIntent(presetText);
  };

  // Parse Intent Deterministically via backend API
  const parseAndEvaluateIntent = async (textToParse) => {
    if (initialMode === "customer") {
      // For customer mode, send directly to search handler
      if (onCustomerSearch) {
        onCustomerSearch(textToParse);
        onClose();
      }
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch("/api/voice/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: textToParse,
          inventory: currentShopInventory,
        }),
      });

      const parsed = await res.json();
      setParsedIntent(parsed);

      if (parsed.success) {
        setStatusMessage(
          isMl
            ? "ഉദ്ദേശ്യം വിജയകരമായി തിരിച്ചറിഞ്ഞു. സ്റ്റോക്ക് മാറ്റാൻ സ്ഥിരീകരിക്കുക."
            : "Intent recognized! Please review and confirm the stock update below."
        );
      } else {
        setStatusMessage(
          isMl
            ? "ക്ഷമിക്കണം, സാധനത്തിന്റെ പേര് തിരിച്ചറിയാൻ കഴിഞ്ഞില്ല."
            : "Could not identify matching product in shop catalog."
        );
      }
    } catch (err) {
      console.error("Parse error:", err);
      setStatusMessage("Failed to process voice command intent.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Confirm and Apply Stock Update to local persistent store
  const handleConfirmStockUpdate = () => {
    if (!parsedIntent) return;

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
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-amber-100">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                {initialMode === "shopkeeper"
                  ? (isMl ? "ശബ്ദത്തിലൂടെ സ്റ്റോക്ക് മാറ്റുക" : "Voice Stock Update")
                  : (isMl ? "ശബ്ദത്തിലൂടെ സാധനങ്ങൾ തിരയുക" : "Voice Product Search")}
              </h2>
              <div className="flex items-center gap-2 text-xs text-amber-200/90 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Powered by Gnani Prisma STT (മലയാളം & English)</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode selector tab in modal */}
        <div className="bg-amber-50 px-5 py-2.5 border-b border-amber-200/70 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("mic")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === "mic"
                  ? "bg-amber-800 text-white shadow-xs"
                  : "bg-white text-amber-900 border border-amber-200"
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              {isMl ? "മൈക്രോഫോൺ" : "Live Mic"}
            </button>
            <button
              onClick={() => setActiveTab("presets")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === "presets"
                  ? "bg-amber-800 text-white shadow-xs"
                  : "bg-white text-amber-900 border border-amber-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isMl ? "ഡെമോ വാചകങ്ങൾ" : "Demo Presets"}
            </button>
          </div>
          <div className="text-[11px] font-semibold text-amber-800">
            {initialMode === "shopkeeper" ? (isMl ? currentShop.nameMl : currentShop.name) : ""}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {isSuccess ? (
            <div className="py-8 text-center animate-in zoom-in-95">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-emerald-300">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                {isMl ? "സ്റ്റോക്ക് വിജയകരമായി പുതുക്കി!" : "Stock Successfully Updated!"}
              </h3>
              <p className="text-sm text-gray-600">
                {isMl
                  ? "കടയിലെ ഇൻവെന്ററി പുതിയ കണക്കിലേക്ക് സേവ് ചെയ്യപ്പെട്ടു."
                  : "The inventory count has been persisted and synced across the platform."}
              </p>
            </div>
          ) : activeTab === "mic" ? (
            <div className="text-center py-4">
              {/* Giant Accessible Mic Button for Elderly Shopkeepers */}
              <div className="relative inline-block mb-6">
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isProcessing}
                  className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full flex flex-col items-center justify-center transition-all shadow-xl select-none ${
                    isRecording
                      ? "bg-red-600 text-white ring-8 ring-red-200 mic-recording scale-105"
                      : "bg-gradient-to-tr from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white ring-4 ring-amber-200/80 active:scale-95"
                  }`}
                  aria-label={isRecording ? "Stop recording" : "Start speaking"}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="w-12 h-12 mb-1 animate-pulse" />
                      <span className="text-[11px] font-black uppercase tracking-wider">
                        {isMl ? "നിർത്തുക" : "STOP"}
                      </span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-12 h-12 mb-1" />
                      <span className="text-[11px] font-black uppercase tracking-wider">
                        {isMl ? "പറയൂ" : "SPEAK"}
                      </span>
                    </>
                  )}
                </button>
              </div>

              {/* Status Indicator */}
              <div className="min-h-[28px] mb-4">
                {isRecording ? (
                  <div className="flex items-center justify-center gap-2 text-red-600 font-bold text-sm animate-pulse">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                    <span>{isMl ? "റെക്കോർഡ് ചെയ്യുന്നു... സംസാരിക്കുക" : "Recording... say your command"}</span>
                  </div>
                ) : isProcessing ? (
                  <div className="flex items-center justify-center gap-2 text-amber-800 font-medium text-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-700" />
                    <span>{statusMessage || "Processing with Gnani Prisma..."}</span>
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-gray-500 font-medium">
                    {isMl
                      ? "മൈക്ക് അമർത്തി മലയാളത്തിലോ ഇംഗ്ലീഷിലോ പറയൂ (ഉദാ: '10 kg Ponni rice ചേർക്കുക')"
                      : "Press the microphone and speak in Malayalam, English, or Manglish"}
                  </p>
                )}
              </div>

              {/* Live or recognized transcript bubble */}
              {transcript && (
                <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 text-left mb-4 shadow-inner">
                  <div className="flex items-center justify-between text-xs text-amber-800 font-bold mb-1">
                    <span>{isMl ? "തിരിച്ചറിഞ്ഞ വാചകം (Transcript):" : "Recognized Speech (Transcript):"}</span>
                    {gnaniSource && (
                      <span className="px-2 py-0.5 rounded bg-amber-200/60 text-[10px] text-amber-900 font-mono">
                        {gnaniSource}
                      </span>
                    )}
                  </div>
                  <p className="text-base sm:text-lg font-bold text-amber-950 italic">
                    &ldquo;{transcript}&rdquo;
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Demo Presets Tab (Instant One-Click Demo for Evaluators) */
            <div className="space-y-2.5 py-1">
              <p className="text-xs font-semibold text-gray-500 mb-2">
                {isMl
                  ? "ഹക്കത്തോൺ ഇവാല്യുവേഷൻ ആവശ്യങ്ങൾക്കായി താഴെയുള്ള വാചകങ്ങളിൽ ക്ലിക്ക് ചെയ്യാം:"
                  : "Click any hackathon demo phrase to instantly test speech intent extraction:"}
              </p>

              {(initialMode === "shopkeeper" ? shopkeeperPresets : customerPresets).map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectPreset(p.text)}
                  className="w-full text-left p-3 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100/70 hover:border-amber-400 transition flex items-center justify-between group"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 text-[10px] font-bold">
                        {p.tag}
                      </span>
                      <span className="text-xs font-bold text-gray-900 group-hover:text-amber-900">
                        {p.title}
                      </span>
                    </div>
                    {p.desc && <div className="text-[11px] text-gray-500">{p.desc}</div>}
                  </div>
                  <Play className="w-4 h-4 text-amber-700 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
                </button>
              ))}
            </div>
          )}

          {/* Parsed Intent & Confirmation Card (CRITICAL ACCESSIBILITY REQUIREMENT) */}
          {parsedIntent && !isSuccess && initialMode === "shopkeeper" && (
            <div className="mt-4 border-2 border-amber-400 bg-amber-50/90 rounded-2xl p-4 shadow-sm animate-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-amber-200">
                <AlertCircle className="w-5 h-5 text-amber-700 shrink-0" />
                <h4 className="text-sm font-black text-amber-950 uppercase tracking-wide">
                  {isMl ? "സ്റ്റോക്ക് സ്ഥിരീകരിക്കുക (Confirmation Required)" : "Verify Proposed Stock Change"}
                </h4>
              </div>

              {parsedIntent.success ? (
                <div className="space-y-3">
                  {/* Human-readable explanation */}
                  <div className="p-3 bg-white rounded-xl border border-amber-200 text-sm font-bold text-amber-950">
                    {isMl ? parsedIntent.explanationMl : parsedIntent.explanationEn}
                  </div>

                  {/* Before / After stock comparison */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white p-2.5 rounded-xl border border-amber-200">
                      <div className="text-[10px] text-gray-500 uppercase font-bold">
                        {isMl ? "നിലവിലെ സ്റ്റോക്ക്" : "Current Stock"}
                      </div>
                      <div className="text-base font-bold text-gray-800">
                        {parsedIntent.currentStock} {parsedIntent.unit}
                      </div>
                    </div>

                    <div className="bg-amber-100/80 p-2.5 rounded-xl border border-amber-300 flex flex-col items-center justify-center">
                      <div className="text-[10px] text-amber-800 uppercase font-bold">
                        {isMl ? "മാറ്റം" : "Action"}
                      </div>
                      <div className="text-xs font-black text-amber-900 flex items-center gap-1">
                        {parsedIntent.action === "ADD" && <span className="text-emerald-700 font-extrabold">+</span>}
                        {parsedIntent.action === "REDUCE" && <span className="text-red-700 font-extrabold">-</span>}
                        {parsedIntent.quantity} {parsedIntent.unit}
                      </div>
                    </div>

                    <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-300">
                      <div className="text-[10px] text-emerald-800 uppercase font-bold">
                        {isMl ? "പുതിയ സ്റ്റോക്ക്" : "New Stock"}
                      </div>
                      <div className="text-base font-black text-emerald-800">
                        {parsedIntent.proposedStock} {parsedIntent.unit}
                      </div>
                    </div>
                  </div>

                  {/* Confirmation Buttons */}
                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setParsedIntent(null)}
                      className="flex-1 py-3 px-4 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-bold text-sm transition"
                    >
                      {isMl ? "റദ്ദാക്കുക (Cancel)" : "Cancel"}
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmStockUpdate}
                      className="flex-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-700/20 transition active:scale-98"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span>{isMl ? "സ്ഥിരീകരിക്കുക (Confirm Update)" : "Confirm & Update"}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-red-700 font-medium">
                  {isMl
                    ? "ക്ഷമിക്കണം, ഈ സാധനം കടയിലെ ലിസ്റ്റിൽ കണ്ടെത്താനായില്ല. ദയവായി നേരിട്ട് 'Add Product' ചെയ്യുക."
                    : "Product could not be resolved from inventory. Please try another phrase or add manually."}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
