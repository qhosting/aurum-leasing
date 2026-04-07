import { GoogleGenAI, Type } from "@google/genai";
import fs from 'fs';
const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
export class AIService {
    genAI = null;
    constructor() {
        if (apiKey) {
            this.genAI = new GoogleGenAI({ apiKey });
        }
    }
    async extractTransportData(filePaths) {
        if (!this.genAI)
            throw new Error("GEMINI_API_KEY is not configured.");
        // Build the prompt parts with multiple images
        const contents = [
            {
                role: 'user',
                parts: [
                    { text: `
            Analyze the provided transport documents (driver's license, SCT permit, insurance policy, etc.).
            Extract the following information for a heavy-duty transport unit profile.
            If a field is not found in the documents, return null for that field.

            Fields to extract:
            - driver_name (Operators full name)
            - license_number (Drivers license ID)
            - rfc (Tax ID with homoclave, e.g., FORP901122LP8)
            - zip_code (Operator's residential ZIP)
            - vehicle_brand (Truck brand, e.g., Freightliner)
            - vehicle_model (Truck model/year)
            - vehicle_color (Truck color)
            - vehicle_plate (Truck primary plate)
            - trailer_plate (Trailer/box plate if found)
            - sct_permit (Official SCT permit number)
            - insurance_policy (Insurance policy number)
            - insurance_company (Insurance company name, e.g., Qualitas)
          ` }
                ]
            }
        ];
        for (const filePath of filePaths) {
            const imageBuffer = fs.readFileSync(filePath);
            const base64Image = imageBuffer.toString('base64');
            // For simplicity, assuming image/jpeg, but should ideally check extension
            contents[0].parts.push({
                inlineData: {
                    data: base64Image,
                    mimeType: "image/jpeg"
                }
            });
        }
        try {
            const response = await this.genAI.models.generateContent({
                model: 'gemini-1.5-flash',
                contents: contents,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            driver_name: { type: Type.STRING },
                            license_number: { type: Type.STRING },
                            rfc: { type: Type.STRING },
                            zip_code: { type: Type.STRING },
                            vehicle_brand: { type: Type.STRING },
                            vehicle_model: { type: Type.STRING },
                            vehicle_color: { type: Type.STRING },
                            vehicle_plate: { type: Type.STRING },
                            trailer_plate: { type: Type.STRING },
                            sct_permit: { type: Type.STRING },
                            insurance_policy: { type: Type.STRING },
                            insurance_company: { type: Type.STRING }
                        }
                    }
                }
            });
            return JSON.parse(response.text || "{}");
        }
        catch (err) {
            console.error("Gemini Extraction Error:", err);
            throw new Error("Failed to extract data from documents via AI.");
        }
    }
}
export const aiService = new AIService();
