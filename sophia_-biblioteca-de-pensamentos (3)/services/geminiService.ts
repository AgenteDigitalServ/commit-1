
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import type { Quote } from '../types';

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1507502707541-f369a3b18502?q=80&w=1080&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1516466723877-e4ec1d736c8a?q=80&w=1080&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=1080&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1080&auto=format&fit=crop"
];

const getRandomFallbackImage = () => FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function withRetry<T>(operation: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    const errorMsg = error?.message?.toLowerCase() || "";
    if ((errorMsg.includes('overloaded') || errorMsg.includes('503') || errorMsg.includes('429')) && retries > 0) {
      await sleep(delay);
      return withRetry(operation, retries - 1, delay * 2);
    }
    throw error;
  }
}

export async function getPhilosophicalQuotes(theme: string): Promise<Quote[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: "gemini-3-flash-preview", 
    contents: `Gere um array JSON com 3 citações curtas e profundas em Português sobre o tema '${theme}'. Use filósofos reais.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            quote: { type: Type.STRING },
            author: { type: Type.STRING },
          },
          required: ["quote", "author"],
        }
      },
    },
  }));

  const jsonString = response.text.trim();
  const quotesRaw = JSON.parse(jsonString);
  return quotesRaw.map((q: any) => ({ ...q, id: generateId(), imageUrl: '' }));
}

export async function getRandomQuote(): Promise<Quote> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Gere uma citação filosófica aleatória curta e impactante em Português. Formato JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          quote: { type: Type.STRING },
          author: { type: Type.STRING },
        },
        required: ["quote", "author"],
      },
    },
  }));

  const jsonString = response.text.trim();
  const dailyQuoteRaw = JSON.parse(jsonString);
  const imageUrl = await generateQuoteImage(dailyQuoteRaw.quote);
  return { ...dailyQuoteRaw, id: generateId(), imageUrl };
}

export async function generateQuoteImage(quoteText: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    // Análise profunda para garantir sintonia
    const analysisResponse = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analise o significado da frase: "${quoteText}". 
      Crie um prompt visual em inglês para uma imagem que represente essa ideia de forma Intimista e Cinematográfica.
      EXIJA: Estilo Chiaroscuro (luz e sombra dramática), tons profundos (deep teals, rich browns, charcoal), luz direcional suave. 
      EVITE: Brancos chapados ou claridade excessiva. 
      CENÁRIO: Natureza sublime, arquitetura clássica sob meia-luz ou texturas abstratas orgânicas. 
      NÃO USE PESSOAS. Apenas o prompt.`,
    }));

    const visualPrompt = analysisResponse.text || "Moody cinematic philosophical atmosphere, shadows and soft light";

    const imageResponse = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `Cinematic photography of ${visualPrompt}. Moody lighting, deep contrast, ethereal shadows, high resolution, 8k, grainy film texture, minimalist composition. 9:16 vertical aspect ratio.` }] },
      config: { imageConfig: { aspectRatio: "9:16" } },
    }));

    let base64Image: string | null = null;
    if (imageResponse.candidates?.[0]?.content?.parts) {
      for (const part of imageResponse.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          base64Image = part.inlineData.data;
          break;
        }
      }
    }

    return base64Image ? `data:image/jpeg;base64,${base64Image}` : getRandomFallbackImage();
  } catch (error) {
    return getRandomFallbackImage();
  }
}
