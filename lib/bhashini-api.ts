import axios from "axios";

interface BhashiniResponse {
  success: boolean;
  original_text?: string;
  translated_text?: string;
  original_lang?: string;
  target_lang?: string;
  error?: string;
}

/**
 * Supported languages for Bhashini speech-to-text and translation.
 */
export const BHASHINI_LANGUAGES = [
  { code: "hi", label: "Hindi (हिन्दी)" },
  { code: "en", label: "English" },
  { code: "mr", label: "Marathi (मराठी)" },
  { code: "ta", label: "Tamil (தமிழ்)" },
  { code: "te", label: "Telugu (తెలుగు)" },
  { code: "bn", label: "Bengali (বাংলা)" },
  { code: "gu", label: "Gujarati (ગુજરાતી)" },
  { code: "kn", label: "Kannada (ಕನ್ನಡ)" },
  { code: "ml", label: "Malayalam (മലയാളം)" },
  { code: "pa", label: "Punjabi (ਪੰਜਾਬੀ)" },
] as const;

export type BhashiniLanguageCode = (typeof BHASHINI_LANGUAGES)[number]["code"];

/**
 * Send recorded audio to the server-side Bhashini API route for
 * speech-to-text conversion and English translation.
 */
export async function processSpeechWithBhashini(
  audioBlob: Blob,
  sourceLang: BhashiniLanguageCode = "hi"
): Promise<BhashiniResponse> {
  try {
    // Convert audio blob to base64 using FileReader
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
        const base64Data = dataUrl.split(",")[1] || "";
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(audioBlob);
    });

    const response = await axios.post("/api/voice/bhashini", {
      audio_base64: base64,
      source_lang: sourceLang,
    });

    return {
      success: true,
      original_text: response.data.original_text,
      translated_text: response.data.translated_text,
      original_lang: response.data.original_lang,
      target_lang: response.data.target_lang,
    };
  } catch (error: any) {
    console.error("Bhashini API Error:", error);
    return {
      success: false,
      error:
        error.response?.data?.error ||
        "Failed to process audio. Is the ML service running?",
    };
  }
}
