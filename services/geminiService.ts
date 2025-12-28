
import { GoogleGenAI, Type } from "@google/genai";
import { Vehicle, Driver } from "../types";

export const analyzeFleetRisk = async (vehicles: Vehicle[], drivers: Driver[]) => {
  // Always initialize GoogleGenAI inside the function to ensure it uses the most up-to-date API key from environment
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Analyze the following leasing fleet data for a CEO. 
    Identify the top 3 risks (Financial, Operational, or Maintenance).
    Suggest 2 immediate actions to improve profitability.
    
    Vehicles: ${JSON.stringify(vehicles)}
    Drivers: ${JSON.stringify(drivers)}
    
    Return the response in a structured format with "risks" (array of {title, description}) and "recommendations" (array of strings).
  `;

  try {
    const response = await ai.models.generateContent({
      // Use gemini-3-pro-preview for complex reasoning and strategic analysis
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        // Using responseSchema for strictly typed JSON output as per best practices
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            risks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Short title of the risk" },
                  description: { type: Type.STRING, description: "Detailed explanation of the risk" }
                }
              }
            },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING, description: "Specific actionable recommendation" }
            }
          }
        }
      }
    });
    
    // Accessing the .text property directly to get the generated string as per @google/genai docs
    const text = response.text;
    return JSON.parse(text || "{}");
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      risks: [{ title: "Error de Análisis", description: "No se pudo conectar con el motor de IA." }],
      recommendations: ["Revise la conexión a internet", "Intente de nuevo en unos minutos"]
    };
  }
};
