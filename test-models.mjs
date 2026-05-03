import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI('AIzaSyCVR3JQv0pH3aMLX02T0aHarXTx_EsdyrI');

async function testModel(modelName) {
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent('Hi');
    const response = await result.response;
    console.log(`[SUCCESS] ${modelName}:`, response.text());
  } catch (error) {
    console.error(`[ERROR] ${modelName}:`, error.message);
  }
}

async function run() {
  await testModel('gemini-1.5-flash');
  await testModel('gemini-pro');
  await testModel('gemini-1.5-pro');
  await testModel('gemini-2.0-flash');
  await testModel('gemini-1.0-pro');
}

run();
