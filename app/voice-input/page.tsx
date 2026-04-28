"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { analyzeIncident } from "@/lib/ai";
import {
  processSpeechWithBhashini,
  BHASHINI_LANGUAGES,
  type BhashiniLanguageCode,
} from "@/lib/bhashini-api";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Mic, Square, Loader2, Volume2, Globe, CheckCircle, ArrowRight, Sparkles } from "lucide-react";

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

  const webSpeechLangs = ["hi", "en"];

  useEffect(() => {
    if (typeof window !== "undefined") {
      // @ts-ignore
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
    return () => { stopRecording(); };
  }, []);

  useEffect(() => {
    if (recognitionRef.current) {
      const langMap: Record<string, string> = {
        en: "en-IN", hi: "hi-IN", mr: "mr-IN", ta: "ta-IN", te: "te-IN",
        bn: "bn-IN", gu: "gu-IN", kn: "kn-IN", ml: "ml-IN", pa: "pa-IN",
      };
      recognitionRef.current.lang = langMap[selectedLang] || "hi-IN";
    }
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
            animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
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
      setTranscript(""); setTranslatedText(""); setLegalResponse("");

      if (useBhashini) {
        audioChunksRef.current = [];
        const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) audioChunksRef.current.push(event.data);
        };
        mediaRecorder.start(250);
        setIsRecording(true);
        toast({ title: "Recording started", description: `Speak in ${BHASHINI_LANGUAGES.find((l) => l.code === selectedLang)?.label || selectedLang}. Using Bhashini for transcription.` });
      } else {
        if (!recognitionRef.current) {
          toast({ title: "Not Supported", description: "Your browser does not support voice input. Please use Chrome or Edge.", variant: "destructive" });
          return;
        }
        recognitionRef.current.onresult = (event: any) => {
          let finalTranscriptText = "";
          for (let i = 0; i < event.results.length; ++i) finalTranscriptText += event.results[i][0].transcript;
          setTranscript(finalTranscriptText);
        };
        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech Recognition Error:", event.error);
          if (event.error !== "no-speech") stopRecording();
        };
        try { recognitionRef.current.start(); setIsRecording(true); } catch (e) { console.log("Already started recognition"); }
        toast({ title: "Recording started", description: `Speak clearly in ${selectedLang === "en" ? "English" : "Hindi"}` });
      }
      visualizeAudio(stream);
    } catch (e) {
      console.error("Error starting recording", e);
      toast({ title: "Microphone Access Denied", description: "Please allow microphone access to use voice input.", variant: "destructive" });
    }
  };

  const stopRecording = async () => {
    if (recognitionRef.current && !useBhashini) recognitionRef.current.stop();
    if (mediaRecorderRef.current && useBhashini) mediaRecorderRef.current.stop();
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    if (audioContextRef.current) { try { audioContextRef.current.close(); } catch (e) { } }
    setIsRecording(false); setAudioLevel(0);
  };

  const [triggerProcessing, setTriggerProcessing] = useState(false);

  const handleStopClick = async () => {
    await stopRecording();
    if (useBhashini) {
      toast({ title: "Recording stopped", description: "Processing with Bhashini..." });
      setTimeout(async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        if (audioBlob.size === 0) { toast({ title: "No audio captured", description: "Please try again.", variant: "destructive" }); return; }
        setLoading(true);
        try {
          const result = await processSpeechWithBhashini(audioBlob, selectedLang);
          if (result.success && result.original_text) {
            setTranscript(result.original_text);
            if (result.translated_text && result.translated_text !== result.original_text) setTranslatedText(result.translated_text);
            toast({ title: "Speech transcribed via Bhashini", description: "Analyzing incident details..." });
            const textToAnalyze = result.translated_text || result.original_text;
            const analysis = await analyzeIncident(textToAnalyze);
            setLegalResponse(JSON.stringify(analysis, null, 2));
            toast({ title: "Analysis complete", description: "Legal recommendations ready!" });
          } else {
            toast({ title: "Bhashini Processing Failed", description: result.error || "Could not transcribe audio. Is the ML service running?", variant: "destructive" });
          }
        } catch (error) {
          console.error("Bhashini processing error:", error);
          toast({ title: "Processing Error", description: "Failed to process audio with Bhashini.", variant: "destructive" });
        } finally { setLoading(false); }
      }, 500);
    } else {
      toast({ title: "Recording stopped" });
      setTriggerProcessing(true);
    }
  };

  useEffect(() => {
    const processTranscript = async (text: string) => {
      try {
        setLoading(true);
        toast({ title: "Speech transcribed", description: "Analyzing incident details..." });
        const analysis = await analyzeIncident(text);
        setLegalResponse(JSON.stringify(analysis, null, 2));
        toast({ title: "Analysis complete", description: "Legal recommendations ready!" });
      } catch (error) {
        console.error("Audio processing error:", error);
        toast({ title: "Voice Processing Failed", description: "Could not process your transcript. Please try again.", variant: "destructive" });
      } finally { setLoading(false); }
    };
    if (!isRecording && triggerProcessing) {
      setTriggerProcessing(false);
      if (transcript.trim().length > 0) processTranscript(transcript);
      else toast({ title: "No speech detected", variant: "destructive" });
    }
  }, [isRecording, triggerProcessing, transcript]);

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center gap-3 px-6 py-4 border-b border-border/40 glass-card">
        <SidebarTrigger />
        <div className="flex flex-col">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Mic className="h-5 w-5 text-primary" />
            Legal Voice Assistant
          </h1>
          <p className="text-sm text-muted-foreground">
            Dictate incidents and receive AI-powered legal analysis
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Language Selector */}
          <Card className="glass-card border-border/40 rounded-2xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Globe className="w-5 h-5 text-primary" />
                <label htmlFor="language-select" className="text-sm font-medium">
                  Speak in:
                </label>
                <select
                  id="language-select"
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value as BhashiniLanguageCode)}
                  disabled={isRecording || loading}
                  className="border border-border/60 rounded-xl px-3 py-2 text-sm bg-background shadow-sm focus:ring-2 focus:ring-primary/30 focus:border-primary/50 disabled:opacity-50 transition-all"
                >
                  {BHASHINI_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>{lang.label}</option>
                  ))}
                </select>
                <Badge className={`text-xs font-semibold ${useBhashini ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
                  {useBhashini ? 'Bhashini ASR' : 'Web Speech API'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Recording Section */}
          <Card className="glass-card border-border/40 rounded-2xl">
            <CardContent className="pt-8 pb-8">
              <div className="flex flex-col items-center space-y-6">
                <div
                  className="relative w-36 h-36 flex items-center justify-center transition-all duration-300"
                  style={{
                    background: `radial-gradient(circle, hsl(var(--primary) / ${audioLevel / 255}), transparent)`,
                  }}
                >
                  <button
                    onClick={isRecording ? handleStopClick : startRecording}
                    disabled={loading}
                    className={`
                      w-28 h-28 rounded-full flex items-center justify-center
                      transition-all duration-300 transform hover:scale-105
                      ${loading
                        ? "bg-muted text-muted-foreground"
                        : isRecording
                          ? 'bg-red-500 hover:bg-red-600 shadow-[0_0_30px_rgba(239,68,68,0.4)] animate-gentle-pulse'
                          : "bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 shadow-xl shadow-indigo-500/20"
                      }
                      text-white relative z-10
                    `}
                  >
                    {loading ? (
                      <Loader2 className="w-10 h-10 animate-spin" />
                    ) : isRecording ? (
                      <Square className="w-10 h-10" />
                    ) : (
                      <Mic className="w-10 h-10" />
                    )}
                  </button>
                </div>

                {/* Audio Level Bar */}
                <div
                  className="flex items-center gap-2 w-full max-w-xs justify-center transition-opacity duration-300"
                  style={{ opacity: isRecording ? 1 : 0.4 }}
                >
                  <Volume2 className={`w-5 h-5 ${isRecording ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="h-3 flex-1 bg-muted/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-75 rounded-full"
                      style={{ width: `${Math.max(5, (audioLevel / 255) * 100)}%` }}
                    />
                  </div>
                </div>

                <p className="text-sm font-medium text-muted-foreground min-h-[20px]">
                  {loading
                    ? "Processing with Legal AI..."
                    : isRecording
                      ? `Listening in ${BHASHINI_LANGUAGES.find((l) => l.code === selectedLang)?.label || selectedLang}... click to stop`
                      : "Click the mic to speak"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <div className={`transition-all duration-500 space-y-6 ${transcript || legalResponse ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            {transcript && (
              <Card className="glass-card border-border/40 rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Mic className="h-4 w-4 text-primary" />
                    Your Transcript
                    {useBhashini && (
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-semibold">
                        via Bhashini
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-base leading-relaxed font-medium">&quot;{transcript}&quot;</p>
                  {translatedText && (
                    <div className="mt-4 pt-4 border-t border-border/40">
                      <p className="text-xs text-muted-foreground mb-1">English Translation:</p>
                      <p className="text-sm leading-relaxed">&quot;{translatedText}&quot;</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {legalResponse && (
              <Card className="glass-card border-border/40 rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="h-4 w-4 text-purple-400" />
                    Legal AI Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-5">
                    {(() => {
                      try {
                        const data = JSON.parse(legalResponse);
                        return (
                          <>
                            <div>
                              <h4 className="font-semibold text-sm mb-2 text-muted-foreground">Primary Sections</h4>
                              <div className="space-y-2">
                                {data.primarySections?.map((s: any, i: number) => (
                                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-mono text-xs shrink-0">{s.section}</Badge>
                                    <span className="text-sm">{s.description} ({s.confidence}%)</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {data.secondarySections?.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-sm mb-2 text-muted-foreground">Secondary Sections</h4>
                                <div className="space-y-2">
                                  {data.secondarySections.map((s: any, i: number) => (
                                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                                      <Badge variant="outline" className="font-mono text-xs border-amber-500/20 text-amber-400 shrink-0">{s.section}</Badge>
                                      <span className="text-sm">{s.description} ({s.confidence}%)</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div>
                              <h4 className="font-semibold text-sm mb-2 text-muted-foreground">Recommendations</h4>
                              <ul className="space-y-2">
                                {data.recommendations?.map((r: string, i: number) => (
                                  <li key={i} className="flex items-start gap-3">
                                    <div className="h-5 w-5 rounded-md bg-purple-500/10 flex items-center justify-center shrink-0 mt-0.5">
                                      <ArrowRight className="h-3 w-3 text-purple-400" />
                                    </div>
                                    <span className="text-sm text-muted-foreground">{r}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex justify-between items-center">
                              <span className="font-semibold text-sm">AI Confidence:</span>
                              <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0 font-mono">{data.confidence}%</Badge>
                            </div>
                          </>
                        );
                      } catch (e) {
                        return (
                          <div>
                            {legalResponse.split("\n").map((paragraph, index) => (
                              <p key={index} className="mb-4 text-sm">{paragraph}</p>
                            ))}
                          </div>
                        );
                      }
                    })()}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Instructions */}
          {!isRecording && !loading && !transcript && (
            <Card className="glass-card border-border/40 rounded-2xl">
              <CardContent className="py-8">
                <div className="text-center space-y-4">
                  <h4 className="font-semibold">How to use this assistant:</h4>
                  <div className="inline-block text-left">
                    <ul className="space-y-3">
                      {[
                        "Select your language from the dropdown above",
                        "Click the microphone button to begin",
                        "Describe the incident clearly",
                        "Click stop to receive legal analysis"
                      ].map((step, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {i + 1}
                          </div>
                          <span className="text-sm">{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    Hindi &amp; English use browser speech recognition. Other languages use{" "}
                    <span className="font-semibold text-emerald-400">Bhashini AI</span>{" "}
                    (requires ML service).
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
