import { GoogleGenAI } from "@google/genai";

// Initialize Gemini Client
// Note: API Key must be provided in the environment or handled via UI prompt if missing (in a real app).
// Here we assume process.env.API_KEY is available as per instructions.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeData = async (dataSample: any[], query?: string) => {
  if (!process.env.API_KEY) {
    return "API Key is missing. Please configure the environment.";
  }

  try {
    const model = 'gemini-2.5-flash';
    const jsonSample = JSON.stringify(dataSample.slice(0, 20)); // Limit context size
    
    const prompt = query 
      ? `Here is a sample of a dataset (JSON format):
${jsonSample}

User Question: "${query}"

Please analyze the data to answer the question. Keep it concise and friendly for a non-technical user.`
      : `Here is a sample of a dataset (JSON format):
${jsonSample}

Please provide 3 interesting insights or trends about this data. Format as a bulleted list. Keep it simple for a beginner.`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I couldn't analyze the data at this moment. Please try again.";
  }
};

export const suggestTransformations = async (headers: string[]) => {
    if (!process.env.API_KEY) return "No API Key";

    try {
        const model = 'gemini-2.5-flash';
        const prompt = `I have a dataset with these columns: ${headers.join(', ')}. 
        Suggest 3 simple data cleaning or transformation steps a user might want to do. 
        Return ONLY a valid JSON array of strings. Example: ["Filter by price > 100", "Sort by sales descending"]`;

        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: 'application/json'
            }
        });
        
        return JSON.parse(response.text || "[]");
    } catch (e) {
        return [];
    }
}