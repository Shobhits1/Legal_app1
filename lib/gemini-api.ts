import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY || ""
);

export async function speechToText(audioBlob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.lang = "hi-IN"; // Set language to Hindi
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        resolve(transcript);
      };

      recognition.onerror = (error: any) => {
        console.error("Speech Recognition Error:", error);
        reject(new Error("Speech recognition failed"));
      };

      // Convert audio blob to audio element and play it
      const audio = new Audio(URL.createObjectURL(audioBlob));
      audio.onended = () => recognition.stop();
      audio.play();
      recognition.start();
    } catch (error) {
      console.error("Speech to Text Error:", error);
      reject(new Error("Failed to initialize speech recognition"));
    }
  });
}

export async function processLegalQuery(text: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });

    const prompt = `
      As a legal assistant, analyze this query and provide helpful information:
      "${text}"
      
      Include relevant Indian legal context if applicable.
      Format your response clearly with sections if needed.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Legal Query Processing Error:", error);
    throw new Error("Failed to process legal query");
  }
}
// Add this function to gemini-api.ts
export async function webSpeechToText(audioBlob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = "hi-IN"; // Hindi language
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      resolve(transcript);
    };

    recognition.onerror = (error: any) => {
      reject(error);
    };

    recognition.start();
  });
}