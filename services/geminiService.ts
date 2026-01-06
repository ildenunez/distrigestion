
import { GoogleGenAI, Type } from "@google/genai";
import { Order, AIAnalysisResult } from "../types";

export const analyzeOrdersWithAI = async (orders: Order[]): Promise<AIAnalysisResult | null> => {
  // Use process.env.API_KEY directly as per SDK guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Resumimos los datos para no exceder tokens innecesariamente
  // Fix: Mapping properties to match the Order interface: id, pendingPayment, and serviceDate
  const simplifiedOrders = orders.slice(0, 50).map(o => ({
    id: o.id,
    pendingPayment: o.pendingPayment,
    status: o.status,
    serviceDate: o.serviceDate
  }));

  const prompt = `Analiza los siguientes pedidos recientes de un negocio y proporciona un resumen ejecutivo, tendencias detectadas y sugerencias de mejora operativa.
  
  Pedidos: ${JSON.stringify(simplifiedOrders)}
  
  Por favor, responde en formato JSON puro.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "Resumen ejecutivo del estado de los pedidos." },
            suggestions: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Lista de sugerencias para mejorar el negocio."
            },
            trends: { type: Type.STRING, description: "Tendencias de ventas o comportamiento detectadas." }
          },
          required: ["summary", "suggestions", "trends"]
        }
      }
    });

    // Access .text property directly (it is a getter, not a method)
    const text = response.text;
    if (!text) return null;

    const result = JSON.parse(text);
    return result as AIAnalysisResult;
  } catch (error) {
    console.error("Error al analizar con Gemini:", error);
    return null;
  }
};
