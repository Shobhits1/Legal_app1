"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import {
    Mic,
    MicOff,
    Send,
    X,
    Volume2,
    VolumeX,
    Globe,
    Sparkles,
    MessageSquare,
    ChevronDown,
    Loader2,
    Bot,
    User,
    Minimize2,
} from "lucide-react"

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChatMessage {
    id: string
    role: "user" | "assistant"
    content: string
    timestamp: Date
}

const LANGUAGES = [
    { code: "hi", label: "Hindi", speechCode: "hi-IN" },
    { code: "en", label: "English", speechCode: "en-IN" },
    { code: "mr", label: "Marathi", speechCode: "mr-IN" },
    { code: "ta", label: "Tamil", speechCode: "ta-IN" },
    { code: "te", label: "Telugu", speechCode: "te-IN" },
    { code: "bn", label: "Bengali", speechCode: "bn-IN" },
    { code: "gu", label: "Gujarati", speechCode: "gu-IN" },
    { code: "kn", label: "Kannada", speechCode: "kn-IN" },
    { code: "ml", label: "Malayalam", speechCode: "ml-IN" },
    { code: "pa", label: "Punjabi", speechCode: "pa-IN" },
] as const

const QUICK_ACTIONS = [
    "Help me write an FIR",
    "Explain IPC Section 302",
    "What are my rights if arrested?",
    "How to file a cybercrime complaint?",
    "Navigate to Case Laws",
]

// ─── Component ───────────────────────────────────────────────────────────────

export function LegalVoiceAssistant() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [inputText, setInputText] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isListening, setIsListening] = useState(false)
    const [isSpeaking, setIsSpeaking] = useState(false)
    const [ttsEnabled, setTtsEnabled] = useState(true)
    const [selectedLang, setSelectedLang] = useState<string>("en")
    const [showLangPicker, setShowLangPicker] = useState(false)
    const [showQuickActions, setShowQuickActions] = useState(true)

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const recognitionRef = useRef<any>(null)
    const synthRef = useRef<SpeechSynthesis | null>(null)

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    // Focus input when chat opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 300)
        }
    }, [isOpen])

    // Initialize speech synthesis
    useEffect(() => {
        if (typeof window !== "undefined") {
            synthRef.current = window.speechSynthesis
        }
    }, [])

    // ─── Send message to Gemini ──────────────────────────────────────────────

    const sendMessage = useCallback(
        async (text: string) => {
            if (!text.trim() || isLoading) return

            const userMsg: ChatMessage = {
                id: Date.now().toString(),
                role: "user",
                content: text.trim(),
                timestamp: new Date(),
            }

            setMessages((prev) => [...prev, userMsg])
            setInputText("")
            setIsLoading(true)
            setShowQuickActions(false)

            try {
                // Build history for context (last 10 messages)
                const history = messages.slice(-10).map((m) => ({
                    role: m.role,
                    content: m.content,
                }))

                const res = await fetch("/api/assistant/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message: text.trim(), history }),
                })

                const data = await res.json()

                if (!res.ok) {
                    throw new Error(data.error || "Failed to get response")
                }

                const aiMsg: ChatMessage = {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content: data.response,
                    timestamp: new Date(),
                }

                setMessages((prev) => [...prev, aiMsg])

                // Speak the response if TTS is enabled
                if (ttsEnabled) {
                    speakText(data.response)
                }
            } catch (error: any) {
                const errorMsg: ChatMessage = {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content:
                        error.message ||
                        "Sorry, I encountered an error. Please try again.",
                    timestamp: new Date(),
                }
                setMessages((prev) => [...prev, errorMsg])
            } finally {
                setIsLoading(false)
            }
        },
        [isLoading, messages, ttsEnabled]
    )

    // ─── Speech-to-Text (Bhashini via Web Speech API) ────────────────────────

    const toggleListening = useCallback(() => {
        if (isListening) {
            recognitionRef.current?.stop()
            setIsListening(false)
            return
        }

        const SpeechRecognition =
            (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition

        if (!SpeechRecognition) {
            alert("Speech recognition not supported in your browser. Use Chrome or Edge.")
            return
        }

        const recognition = new SpeechRecognition()
        const lang = LANGUAGES.find((l) => l.code === selectedLang)
        recognition.lang = lang?.speechCode || "en-IN"
        recognition.continuous = false
        recognition.interimResults = true

        let finalTranscript = ""

        recognition.onresult = (event: any) => {
            let interim = ""
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript
                } else {
                    interim += event.results[i][0].transcript
                }
            }
            setInputText(finalTranscript + interim)
        }

        recognition.onend = () => {
            setIsListening(false)
            if (finalTranscript.trim()) {
                sendMessage(finalTranscript.trim())
            }
        }

        recognition.onerror = (event: any) => {
            console.error("Speech recognition error:", event.error)
            setIsListening(false)
        }

        recognitionRef.current = recognition
        recognition.start()
        setIsListening(true)
    }, [isListening, selectedLang, sendMessage])

    // ─── Text-to-Speech ──────────────────────────────────────────────────────

    const speakText = useCallback(
        (text: string) => {
            if (!synthRef.current || !ttsEnabled) return

            // Cancel any ongoing speech
            synthRef.current.cancel()

            // Clean markdown formatting for speech
            const cleanText = text
                .replace(/\*\*/g, "")
                .replace(/\*/g, "")
                .replace(/#{1,6}\s/g, "")
                .replace(/```[\s\S]*?```/g, "code block")
                .replace(/`[^`]+`/g, (match) => match.replace(/`/g, ""))
                .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
                .replace(/[-•]\s/g, "")
                .substring(0, 500) // Limit to avoid very long speech

            const utterance = new SpeechSynthesisUtterance(cleanText)
            const lang = LANGUAGES.find((l) => l.code === selectedLang)
            utterance.lang = lang?.speechCode || "en-IN"
            utterance.rate = 0.95
            utterance.pitch = 1.0

            utterance.onstart = () => setIsSpeaking(true)
            utterance.onend = () => setIsSpeaking(false)
            utterance.onerror = () => setIsSpeaking(false)

            synthRef.current.speak(utterance)
        },
        [ttsEnabled, selectedLang]
    )

    const stopSpeaking = useCallback(() => {
        synthRef.current?.cancel()
        setIsSpeaking(false)
    }, [])

    // ─── Handle key press ────────────────────────────────────────────────────

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            sendMessage(inputText)
        }
    }

    // ─── Render message content with basic markdown ──────────────────────────

    const renderContent = (content: string) => {
        // Split by code blocks first
        const parts = content.split(/(```[\s\S]*?```)/g)

        return parts.map((part, i) => {
            if (part.startsWith("```")) {
                const code = part.replace(/```\w*\n?/g, "").replace(/```$/g, "")
                return (
                    <pre
                        key={i}
                        className="va-code-block"
                    >
                        <code>{code}</code>
                    </pre>
                )
            }

            // Process inline formatting
            const lines = part.split("\n")
            return lines.map((line, j) => {
                if (!line.trim()) return <br key={`${i}-${j}`} />

                // Headers
                if (line.startsWith("### "))
                    return (
                        <h4 key={`${i}-${j}`} className="va-heading">
                            {line.slice(4)}
                        </h4>
                    )
                if (line.startsWith("## "))
                    return (
                        <h3 key={`${i}-${j}`} className="va-heading">
                            {line.slice(3)}
                        </h3>
                    )

                // Bullet points
                if (line.match(/^[-•*]\s/)) {
                    return (
                        <div key={`${i}-${j}`} className="va-bullet">
                            <span className="va-bullet-dot" />
                            <span
                                dangerouslySetInnerHTML={{
                                    __html: line
                                        .slice(2)
                                        .replace(
                                            /\*\*(.+?)\*\*/g,
                                            '<strong class="va-bold">$1</strong>'
                                        )
                                        .replace(
                                            /`([^`]+)`/g,
                                            '<code class="va-inline-code">$1</code>'
                                        ),
                                }}
                            />
                        </div>
                    )
                }

                // Numbered list
                if (line.match(/^\d+\.\s/)) {
                    return (
                        <div key={`${i}-${j}`} className="va-numbered">
                            <span
                                dangerouslySetInnerHTML={{
                                    __html: line
                                        .replace(
                                            /\*\*(.+?)\*\*/g,
                                            '<strong class="va-bold">$1</strong>'
                                        )
                                        .replace(
                                            /`([^`]+)`/g,
                                            '<code class="va-inline-code">$1</code>'
                                        ),
                                }}
                            />
                        </div>
                    )
                }

                // Regular paragraph
                return (
                    <p
                        key={`${i}-${j}`}
                        className="va-paragraph"
                        dangerouslySetInnerHTML={{
                            __html: line
                                .replace(
                                    /\*\*(.+?)\*\*/g,
                                    '<strong class="va-bold">$1</strong>'
                                )
                                .replace(
                                    /`([^`]+)`/g,
                                    '<code class="va-inline-code">$1</code>'
                                ),
                        }}
                    />
                )
            })
        })
    }

    // ─── Render ──────────────────────────────────────────────────────────────

    return (
        <>
            {/* Floating Orb Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`va-orb ${isOpen ? "va-orb-hidden" : ""} ${isListening ? "va-orb-listening" : ""}`}
                aria-label="Open Legal Voice Assistant"
                id="voice-assistant-orb"
            >
                <div className="va-orb-rings">
                    <div className="va-orb-ring va-orb-ring-1" />
                    <div className="va-orb-ring va-orb-ring-2" />
                    <div className="va-orb-ring va-orb-ring-3" />
                </div>
                <div className="va-orb-inner">
                    <Sparkles className="va-orb-icon" />
                </div>
            </button>

            {/* Chat Panel */}
            <div className={`va-panel ${isOpen ? "va-panel-open" : ""}`}>
                {/* Header */}
                <div className="va-header">
                    <div className="va-header-left">
                        <div className="va-avatar">
                            <Bot className="va-avatar-icon" />
                            {isSpeaking && <div className="va-avatar-speaking" />}
                        </div>
                        <div>
                            <h3 className="va-title">NyayaMitra AI</h3>
                            <p className="va-subtitle">
                                {isListening
                                    ? "Listening..."
                                    : isLoading
                                        ? "Thinking..."
                                        : isSpeaking
                                            ? "Speaking..."
                                            : "Legal Voice Assistant"}
                            </p>
                        </div>
                    </div>
                    <div className="va-header-actions">
                        {/* Language Picker */}
                        <div className="va-lang-wrapper">
                            <button
                                onClick={() => setShowLangPicker(!showLangPicker)}
                                className="va-icon-btn"
                                title="Change language"
                            >
                                <Globe className="w-4 h-4" />
                            </button>
                            {showLangPicker && (
                                <div className="va-lang-dropdown">
                                    {LANGUAGES.map((lang) => (
                                        <button
                                            key={lang.code}
                                            onClick={() => {
                                                setSelectedLang(lang.code)
                                                setShowLangPicker(false)
                                            }}
                                            className={`va-lang-option ${selectedLang === lang.code ? "va-lang-active" : ""}`}
                                        >
                                            {lang.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* TTS Toggle */}
                        <button
                            onClick={() => {
                                if (isSpeaking) stopSpeaking()
                                setTtsEnabled(!ttsEnabled)
                            }}
                            className={`va-icon-btn ${ttsEnabled ? "va-icon-btn-active" : ""}`}
                            title={ttsEnabled ? "Disable voice output" : "Enable voice output"}
                        >
                            {ttsEnabled ? (
                                <Volume2 className="w-4 h-4" />
                            ) : (
                                <VolumeX className="w-4 h-4" />
                            )}
                        </button>

                        {/* Close */}
                        <button
                            onClick={() => {
                                setIsOpen(false)
                                stopSpeaking()
                            }}
                            className="va-icon-btn va-close-btn"
                            title="Close assistant"
                        >
                            <Minimize2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="va-messages">
                    {/* Welcome message */}
                    {messages.length === 0 && (
                        <div className="va-welcome">
                            <div className="va-welcome-orb">
                                <Sparkles className="va-welcome-icon" />
                            </div>
                            <h4 className="va-welcome-title">
                                Namaste! I&apos;m NyayaMitra AI
                            </h4>
                            <p className="va-welcome-text">
                                Your intelligent legal assistant. Ask me about Indian laws, FIR
                                procedures, legal sections, or let me help you navigate the
                                platform.
                            </p>

                            {/* Quick Actions */}
                            {showQuickActions && (
                                <div className="va-quick-actions">
                                    {QUICK_ACTIONS.map((action, i) => (
                                        <button
                                            key={i}
                                            onClick={() => sendMessage(action)}
                                            className="va-quick-btn"
                                            style={{ animationDelay: `${i * 80}ms` }}
                                        >
                                            <MessageSquare className="w-3 h-3 shrink-0" />
                                            {action}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Chat Messages */}
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`va-message ${msg.role === "user" ? "va-msg-user" : "va-msg-ai"}`}
                        >
                            <div className={`va-msg-avatar ${msg.role === "user" ? "va-msg-avatar-user" : "va-msg-avatar-ai"}`}>
                                {msg.role === "user" ? (
                                    <User className="w-3.5 h-3.5" />
                                ) : (
                                    <Bot className="w-3.5 h-3.5" />
                                )}
                            </div>
                            <div
                                className={`va-msg-bubble ${msg.role === "user" ? "va-bubble-user" : "va-bubble-ai"}`}
                            >
                                {msg.role === "assistant" ? (
                                    <div className="va-msg-content">
                                        {renderContent(msg.content)}
                                    </div>
                                ) : (
                                    <p className="va-msg-text">{msg.content}</p>
                                )}
                                <span className="va-msg-time">
                                    {msg.timestamp.toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </span>
                            </div>
                        </div>
                    ))}

                    {/* Loading indicator */}
                    {isLoading && (
                        <div className="va-message va-msg-ai">
                            <div className="va-msg-avatar va-msg-avatar-ai">
                                <Bot className="w-3.5 h-3.5" />
                            </div>
                            <div className="va-bubble-ai va-msg-bubble">
                                <div className="va-typing">
                                    <div className="va-typing-dot" style={{ animationDelay: "0ms" }} />
                                    <div className="va-typing-dot" style={{ animationDelay: "150ms" }} />
                                    <div className="va-typing-dot" style={{ animationDelay: "300ms" }} />
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Listening Waveform */}
                {isListening && (
                    <div className="va-waveform">
                        <div className="va-waveform-inner">
                            {[...Array(12)].map((_, i) => (
                                <div
                                    key={i}
                                    className="va-wave-bar"
                                    style={{
                                        animationDelay: `${i * 80}ms`,
                                        height: `${12 + Math.random() * 20}px`,
                                    }}
                                />
                            ))}
                        </div>
                        <span className="va-wave-label">Listening... Speak now</span>
                    </div>
                )}

                {/* Input Area */}
                <div className="va-input-area">
                    <div className="va-input-row">
                        <button
                            onClick={toggleListening}
                            className={`va-mic-btn ${isListening ? "va-mic-active" : ""}`}
                            title={isListening ? "Stop listening" : "Start voice input"}
                        >
                            {isListening ? (
                                <MicOff className="w-4 h-4" />
                            ) : (
                                <Mic className="w-4 h-4" />
                            )}
                        </button>
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask about laws, FIR, rights..."
                            className="va-text-input"
                            disabled={isLoading}
                        />
                        <button
                            onClick={() => sendMessage(inputText)}
                            disabled={!inputText.trim() || isLoading}
                            className="va-send-btn"
                            title="Send message"
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                    <p className="va-input-hint">
                        Press Enter to send • Click mic for voice
                    </p>
                </div>
            </div>
        </>
    )
}
