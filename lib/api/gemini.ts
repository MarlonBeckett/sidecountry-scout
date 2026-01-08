/**
 * Google Gemini AI Client
 * Handles AI briefing generation and chat
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API } from '@/constants';

export class GeminiClient {
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Generate briefing using Gemini Flash
   */
  async generateBriefing(prompt: string) {
    const model = this.genAI.getGenerativeModel({
      model: GEMINI_API.MODELS.BRIEFING,
      generationConfig: {
        ...GEMINI_API.GENERATION_CONFIG,
        responseMimeType: 'application/json',
      },
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  }

  /**
   * Stream chat responses
   */
  async* streamChat(messages: Array<{ role: string; content: string }>, systemPrompt?: string) {
    const model = this.genAI.getGenerativeModel({
      model: GEMINI_API.MODELS.CHAT,
      generationConfig: GEMINI_API.GENERATION_CONFIG,
      systemInstruction: systemPrompt,
    });

    const chat = model.startChat({
      history: messages.slice(0, -1).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      })),
    });

    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessageStream(lastMessage.content);

    for await (const chunk of result.stream) {
      yield chunk.text();
    }
  }
}

// Create and export singleton instance (will be initialized in API routes)
export function createGeminiClient(): GeminiClient {
  const apiKey = process.env.google_gemini_api;
  if (!apiKey) {
    throw new Error('Missing Google Gemini API key');
  }
  return new GeminiClient(apiKey);
}
