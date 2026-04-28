require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function test() {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent('Say hello in one word');
        console.log('SUCCESS:', result.response.text());
    } catch (e) {
        console.error('ERROR 1.5-flash:', e.message);
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const result = await model.generateContent('Say hello in one word');
        console.log('SUCCESS:', result.response.text());
    } catch (e) {
        console.error('ERROR 2.0-flash:', e.message);
    }
}

test();
