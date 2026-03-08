"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { analyzeIncident } from "@/lib/ai";
import {
  processSpeechWithBhashini,
  BHASHINI_LANGUAGES,
  type BhashiniLanguageCode,
} from "@/lib/bhashini-api";
import { Mic, Square, Loader2, Volume2, Globe } from "lucide-react";

export default function VoiceInput() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [legalResponse, setLegalResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [selectedLang, setSelectedLang] =
    useState<BhashiniLanguageCode>("hi");
  const [useBhashini, setUseBhashini] = useState(false);

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  // Languages that Web Speech API supports well
  const webSpeechLangs = ["hi", "en"];

  useEffect(() => {
    if (typeof window !== "undefined") {
      // @ts-ignore - Web Speech API types not available in standard TS
      const SpeechRecognition = window.SpeechRecognition || // @ts-ignore
        window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang =
          selectedLang === "en" ? "en-IN" : "hi-IN";
      }
    }

    return () => {
      stopRecording();
    };
  }, []);

  // Update recognition language when selectedLang changes
  useEffect(() => {
    if (recognitionRef.current) {
      const langMap: Record<string, string> = {
        en: "en-IN",
        hi: "hi-IN",
        mr: "mr-IN",
        ta: "ta-IN",
        te: "te-IN",
        bn: "bn-IN",
        gu: "gu-IN",
        kn: "kn-IN",
        ml: "ml-IN",
        pa: "pa-IN",
      };
      recognitionRef.current.lang = langMap[selectedLang] || "hi-IN";
    }

    // Use Bhashini for languages that Web Speech API doesn't handle well
    setUseBhashini(!webSpeechLangs.includes(selectedLang));
  }, [selectedLang]);

  const visualizeAudio = (stream: MediaStream) => {
    try {
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      source.connect(analyserRef.current);

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      const updateAudioLevel = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average);

          if (isRecording) {
            animationFrameRef.current =
              requestAnimationFrame(updateAudioLevel);
          }
        }
      };
      updateAudioLevel();
    } catch (e) {
      console.error("Audio Context failed", e);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      setTranscript("");
      setTranslatedText("");
      setLegalResponse("");

      if (useBhashini) {
        // Use MediaRecorder to capture audio for Bhashini
        audioChunksRef.current = [];
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: "audio/webm",
        });
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.start(250); // Collect data in 250ms chunks
        setIsRecording(true);

        toast({
          title: "Recording started",
          description: `Speak in ${BHASHINI_LANGUAGES.find((l) => l.code === selectedLang)?.label || selectedLang}. Using Bhashini for transcription.`,
        });
      } else {
        // Use Web Speech API for Hindi/English
        if (!recognitionRef.current) {
          toast({
            title: "Not Supported",
            description:
              "Your browser does not support voice input. Please use Chrome or Edge.",
            variant: "destructive",
          });
          return;
        }

        recognitionRef.current.onresult = (event: any) => {
          let finalTranscriptText = "";
          for (let i = 0; i < event.results.length; ++i) {
            finalTranscriptText += event.results[i][0].transcript;
          }
          setTranscript(finalTranscriptText);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech Recognition Error:", event.error);
          if (event.error !== "no-speech") {
            stopRecording();
          }
        };

        try {
          recognitionRef.current.start();
          setIsRecording(true);
        } catch (e) {
          console.log("Already started recognition");
        }

        toast({
          title: "Recording started",
          description: `Speak clearly in ${selectedLang === "en" ? "English" : "Hindi"}`,
        });
      }

      // Start audio level visualizer
      visualizeAudio(stream);
    } catch (e) {
      console.error("Error starting recording", e);
      toast({
        title: "Microphone Access Denied",
        description: "Please allow microphone access to use voice input.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = async () => {
    if (recognitionRef.current && !useBhashini) {
      recognitionRef.current.stop();
    }

    if (mediaRecorderRef.current && useBhashini) {
      mediaRecorderRef.current.stop();
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) { }
    }

    setIsRecording(false);
    setAudioLevel(0);
  };

  const [triggerProcessing, setTriggerProcessing] = useState(false);

  const handleStopClick = async () => {
    await stopRecording();

    if (useBhashini) {
      // Process audio through Bhashini
      toast({ title: "Recording stopped", description: "Processing with Bhashini..." });

      // Small delay to ensure all audio chunks are collected
      setTimeout(async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        if (audioBlob.size === 0) {
          toast({
            title: "No audio captured",
            description: "Please try again.",
            variant: "destructive",
          });
          return;
        }

        setLoading(true);
        try {
          const result = await processSpeechWithBhashini(
            audioBlob,
            selectedLang
          );

          if (result.success && result.original_text) {
            setTranscript(result.original_text);
            if (result.translated_text && result.translated_text !== result.original_text) {
              setTranslatedText(result.translated_text);
            }

            toast({
              title: "Speech transcribed via Bhashini",
              description: "Analyzing incident details...",
            });

            // Use translated text (English) for analysis, or original if same language
            const textToAnalyze =
              result.translated_text || result.original_text;
            const analysis = await analyzeIncident(textToAnalyze);
            setLegalResponse(JSON.stringify(analysis, null, 2));

            toast({
              title: "Analysis complete",
              description: "Legal recommendations ready!",
            });
          } else {
            toast({
              title: "Bhashini Processing Failed",
              description:
                result.error ||
                "Could not transcribe audio. Is the ML service running?",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Bhashini processing error:", error);
          toast({
            title: "Processing Error",
            description: "Failed to process audio with Bhashini.",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      }, 500);
    } else {
      toast({ title: "Recording stopped" });
      setTriggerProcessing(true);
    }
  };

  // Process transcript from Web Speech API
  useEffect(() => {
    const processTranscript = async (text: string) => {
      try {
        setLoading(true);
        toast({
          title: "Speech transcribed",
          description: "Analyzing incident details...",
        });

        const analysis = await analyzeIncident(text);
        setLegalResponse(JSON.stringify(analysis, null, 2));

        toast({
          title: "Analysis complete",
          description: "Legal recommendations ready!",
        });
      } catch (error) {
        console.error("Audio processing error:", error);
        toast({
          title: "Voice Processing Failed",
          description:
            "Could not process your transcript. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (!isRecording && triggerProcessing) {
      setTriggerProcessing(false);
      if (transcript.trim().length > 0) {
        processTranscript(transcript);
      } else {
        toast({ title: "No speech detected", variant: "destructive" });
      }
    }
  }, [isRecording, triggerProcessing, transcript]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          Legal Voice Assistant
        </h1>

        {/* Language Selector */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <Globe className="w-5 h-5 text-blue-500" />
          <label
            htmlFor="language-select"
            className="text-sm font-medium text-gray-700"
          >
            Speak in:
          </label>
          <select
            id="language-select"
            value={selectedLang}
            onChange={(e) =>
              setSelectedLang(e.target.value as BhashiniLanguageCode)
            }
            disabled={isRecording || loading}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
          >
            {BHASHINI_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
          {useBhashini && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
              Bhashini ASR
            </span>
          )}
          {!useBhashini && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
              Web Speech API
            </span>
          )}
        </div>

        {/* Recording Section */}
        <div className="flex flex-col items-center mb-8 space-y-4">
          <div
            className="relative w-32 h-32 flex items-center justify-center transition-all duration-300"
            style={{
              background: `radial-gradient(circle, rgba(59, 130, 246, ${audioLevel / 255
                }), transparent)`,
            }}
          >
            <button
              onClick={isRecording ? handleStopClick : startRecording}
              disabled={loading}
              className={`
                w-24 h-24 rounded-full 
                flex items-center justify-center
                transition-all duration-200 transform hover:scale-105
                ${loading
                  ? "bg-gray-400"
                  : isRecording
                    ? 'bg-red-500 hover:bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                    : "bg-blue-500 hover:bg-blue-600 shadow-lg"
                }
                text-white relative z-10
              `}
            >
              {loading ? (
                <Loader2 className="w-10 h-10 animate-spin" />
              ) : isRecording ? (
                <Square className="w-10 h-10 animate-pulse" />
              ) : (
                <Mic className="w-10 h-10" />
              )}
            </button>
          </div>
          <div
            className="flex items-center gap-2 w-full max-w-xs justify-center transition-opacity duration-300"
            style={{ opacity: isRecording ? 1 : 0.5 }}
          >
            <Volume2
              className={`w-5 h-5 ${isRecording ? "text-blue-500" : "text-gray-400"
                }`}
            />
            <div className="h-3 flex-1 bg-gray-100 rounded-full overflow-hidden shadow-inner flex items-center">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-75"
                style={{
                  width: `${Math.max(5, (audioLevel / 255) * 100)}%`,
                }}
              />
            </div>
          </div>
          <p className="text-sm font-medium text-gray-500 min-h-[20px]">
            {loading
              ? "Processing with Legal AI..."
              : isRecording
                ? `Listening in ${BHASHINI_LANGUAGES.find((l) => l.code === selectedLang)?.label || selectedLang}... click to stop`
                : "Click the mic to speak"}
          </p>
        </div>

        {/* Results Display */}
        <div
          className={`transition-all duration-500 ${transcript || legalResponse
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4"
            }`}
        >
          <div className="space-y-6">
            {transcript && (
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 shadow-sm">
                <h3 className="font-bold text-lg mb-3 text-gray-800 flex items-center gap-2 pb-2 border-b border-gray-200">
                  <Mic className="w-5 h-5 text-blue-500" />
                  Your Transcript
                  {useBhashini && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full ml-2">
                      via Bhashini
                    </span>
                  )}
                </h3>
                <p className="text-gray-700 text-lg leading-relaxed font-medium">
                  &quot;{transcript}&quot;
                </p>
                {translatedText && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-500 mb-1">
                      English Translation:
                    </p>
                    <p className="text-gray-700 text-base leading-relaxed">
                      &quot;{translatedText}&quot;
                    </p>
                  </div>
                )}
              </div>
            )}

            {legalResponse && (
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-200 shadow-sm">
                <h3 className="font-bold text-lg mb-3 text-blue-800 flex items-center gap-2 pb-2 border-b border-blue-200/50">
                  <span className="text-xl">⚖️</span> Legal AI Analysis
                </h3>
                <div className="prose max-w-none text-gray-800 font-medium text-sm space-y-4">
                  {(() => {
                    try {
                      const data = JSON.parse(legalResponse);
                      return (
                        <>
                          <div>
                            <span className="font-bold text-blue-900 border-b border-blue-200 pb-1 mb-2 inline-block">
                              Primary Sections:
                            </span>
                            <ul className="mt-2 space-y-1">
                              {data.primarySections?.map(
                                (s: any, i: number) => (
                                  <li key={i} className="flex gap-2">
                                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs shrink-0 self-start">
                                      {s.section}
                                    </span>
                                    <span className="text-gray-700">
                                      {s.description} ({s.confidence}%)
                                    </span>
                                  </li>
                                )
                              )}
                            </ul>
                          </div>

                          {data.secondarySections?.length > 0 && (
                            <div>
                              <span className="font-bold text-blue-900 border-b border-blue-200 pb-1 mb-2 inline-block">
                                Secondary Sections:
                              </span>
                              <ul className="mt-2 space-y-1">
                                {data.secondarySections.map(
                                  (s: any, i: number) => (
                                    <li key={i} className="flex gap-2">
                                      <span className="bg-gray-200 text-gray-800 px-2 py-0.5 rounded text-xs shrink-0 self-start">
                                        {s.section}
                                      </span>
                                      <span className="text-gray-700">
                                        {s.description} ({s.confidence}%)
                                      </span>
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}

                          <div>
                            <span className="font-bold text-blue-900 border-b border-blue-200 pb-1 mb-2 inline-block">
                              Investigation Recommendations:
                            </span>
                            <ul className="mt-2 space-y-1 list-disc pl-5">
                              {data.recommendations?.map(
                                (r: string, i: number) => (
                                  <li key={i} className="text-gray-700">
                                    {r}
                                  </li>
                                )
                              )}
                            </ul>
                          </div>

                          <div className="bg-blue-100/50 p-3 rounded-lg border border-blue-200 flex justify-between items-center mt-4">
                            <span className="font-bold text-blue-900">
                              Overall AI Confidence:
                            </span>
                            <span className="bg-blue-500 text-white font-bold px-3 py-1 rounded-full text-sm">
                              {data.confidence}%
                            </span>
                          </div>
                        </>
                      );
                    } catch (e) {
                      return (
                        <div>
                          {legalResponse.split("\n").map((paragraph, index) => (
                            <p key={index} className="mb-4">
                              {paragraph}
                            </p>
                          ))}
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        {!isRecording && !loading && !transcript && (
          <div className="text-center text-gray-500 mt-10 space-y-3 animate-fade-in transition-all">
            <h4 className="font-medium text-gray-700">
              How to use this assistant:
            </h4>
            <div className="bg-gray-50 rounded-lg p-4 inline-block text-left text-sm text-gray-600 shadow-sm border border-gray-100">
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                    1
                  </span>
                  Select your language from the dropdown above
                </li>
                <li className="flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                    2
                  </span>
                  Click the microphone button to begin
                </li>
                <li className="flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                    3
                  </span>
                  Describe the incident clearly
                </li>
                <li className="flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                    4
                  </span>
                  Click stop to receive legal analysis
                </li>
              </ul>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Hindi &amp; English use browser speech recognition. Other languages use{" "}
              <span className="font-semibold text-green-600">
                Bhashini AI
              </span>{" "}
              (requires ML service).
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
