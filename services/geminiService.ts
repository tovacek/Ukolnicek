
import { GoogleGenAI, Type } from "@google/genai";

export const generateSmartTasks = async (childAge: number, interests: string): Promise<any[]> => {
  // Always check for API key in environment variable
  if (!process.env.API_KEY) {
    console.warn("API Key missing for Gemini");
    return [];
  }

  try {
    // Initialize with named parameter
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `Navrhni 3 domácí úkoly nebo vzdělávací aktivity pro dítě ve věku ${childAge} let, které se zajímá o: ${interests}.
    Úkoly by měly být zábavné, proveditelné doma a motivující.
    Vrať pouze čistý JSON (pole objektů), bez markdown formátování.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Krátký a veselý název úkolu" },
              description: { type: Type.STRING, description: "Jednoduchý popis, co má dítě udělat" },
              suggestedPoints: { type: Type.INTEGER, description: "Navrhovaná odměna v bodech (10-100)" },
              suggestedMoney: { type: Type.INTEGER, description: "Navrhovaná odměna v korunách (0-50)" }
            },
            required: ["title", "description", "suggestedPoints", "suggestedMoney"]
          }
        }
      }
    });

    // Access text directly property
    const text = response.text;
    if (!text) return [];
    
    // Manual parsing is safer with generated content
    try {
        return JSON.parse(text);
    } catch (e) {
        console.error("Failed to parse JSON from Gemini response", text);
        return [];
    }

  } catch (error) {
    console.error("Error generating tasks:", error);
    return [];
  }
};

export const generateMotivationalMessage = async (childName: string, completedCount: number): Promise<string> => {
    if (!process.env.API_KEY) return "Skvělá práce! Jen tak dál!";

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Napiš velmi krátkou (max 1 věta), veselou a povzbuzující zprávu pro dítě jménem ${childName}, které dnes splnilo ${completedCount} úkolů. Použij emoji.`,
      });
      
      return response.text || "Super práce!";
    } catch (e) {
      console.error("Error generating message:", e);
      return "Dobrá práce!";
    }
};
