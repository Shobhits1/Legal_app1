const fs = require("fs");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

function loadGeminiKey() {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) {
    return process.env.GEMINI_API_KEY.trim();
  }

  const envLocalPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envLocalPath)) return "";

  const file = fs.readFileSync(envLocalPath, "utf8");
  const match = file.match(/^\s*GEMINI_API_KEY\s*=\s*"?([^"\r\n]+)"?\s*$/m);
  return match?.[1]?.trim() || "";
}

function printErrorDetails(error) {
  const status = error?.status || error?.code;
  const message = error?.message || "Unknown error";

  console.error("\n[FAILED] Gemini check failed");
  console.error(`Status: ${status ?? "N/A"}`);
  console.error(`Message: ${message}`);

  if (String(message).includes("API key not valid")) {
    console.error("Hint: Key is invalid or restricted incorrectly.");
  } else if (String(message).includes("Quota exceeded") || status === 429) {
    console.error("Hint: Key is valid, but quota/billing is exhausted or unavailable.");
  } else if (status === 404) {
    console.error("Hint: Model name is not available for this API version.");
  }
}

async function run() {
  const apiKey = loadGeminiKey();

  if (!apiKey) {
    console.error("[FAILED] GEMINI_API_KEY not found.");
    console.error("Set it in .env.local or current terminal environment.");
    process.exit(1);
  }

  console.log("Checking Gemini API key...");
  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent("Reply with exactly: OK");
    const text = result.response.text();

    console.log("\n[SUCCESS] Gemini API key is working.");
    console.log(`Model: gemini-2.0-flash`);
    console.log(`Response: ${text}`);
    process.exit(0);
  } catch (error) {
    printErrorDetails(error);
    process.exit(1);
  }
}

run();
