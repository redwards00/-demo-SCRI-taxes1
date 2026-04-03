import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface TaxRates {
  stateName: string;
  stateTaxRate: number; // as a decimal, e.g., 0.05 for 5%
  localTaxRate: number; // as a decimal
  isStateIncomeTaxFree: boolean;
  notes?: string;
}

export async function getTaxRatesForLocation(location: string): Promise<TaxRates> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Provide the estimated state and local income tax rates for the location "${location}" in the United States for the 2024/2025 tax year.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          stateName: { type: Type.STRING },
          stateTaxRate: { type: Type.NUMBER, description: "State income tax rate as a decimal (e.g. 0.05)" },
          localTaxRate: { type: Type.NUMBER, description: "Local/City income tax rate as a decimal (e.g. 0.01)" },
          isStateIncomeTaxFree: { type: Type.BOOLEAN },
          notes: { type: Type.STRING }
        },
        required: ["stateName", "stateTaxRate", "localTaxRate", "isStateIncomeTaxFree"]
      }
    }
  });

  try {
    return JSON.parse(response.text || "{}") as TaxRates;
  } catch (e) {
    console.error("Failed to parse tax rates", e);
    return {
      stateName: "Unknown",
      stateTaxRate: 0,
      localTaxRate: 0,
      isStateIncomeTaxFree: false
    };
  }
}
