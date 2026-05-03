const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testApiKey() {
    const apiKey = 'AIzaSyCvikP1H-d083yD0HR6y8TKQj2l9QKfHUo';
    const genAI = new GoogleGenerativeAI(apiKey);
    
    console.log("Testing API Key...");
    
    const modelsToTest = ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro'];
    
    for (const modelName of modelsToTest) {
        try {
            console.log(`\nTesting model: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent('Hi');
            console.log(`[SUCCESS] ${modelName} is working! Response: ${result.response.text()}`);
        } catch (error) {
            console.error(`[ERROR] ${modelName} failed:`);
            console.error(error.message);
        }
    }
}

testApiKey();
