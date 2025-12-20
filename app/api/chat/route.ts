import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.google_gemini_api || '');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_SECRET_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  message: string;
  conversationHistory?: ChatMessage[];
  center?: string;
  zone?: string;
}

export async function POST(request: Request) {
  try {
    const body: ChatRequest = await request.json();
    const { message, conversationHistory = [], center, zone } = body;

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get today's date for forecast lookup
    const today = new Date().toISOString().split('T')[0];

    // Fetch the latest briefing and forecast data if center and zone are provided
    let contextInfo = '';

    if (center && zone) {
      // Try to get the briefing from the database
      const { data: briefing } = await supabase
        .from('avalanche_briefings')
        .select('*')
        .eq('center', center)
        .eq('zone', zone)
        .eq('forecast_date', today)
        .single();

      // Try to get the forecast from the database
      const { data: forecast } = await supabase
        .from('avalanche_forecasts')
        .select('*')
        .eq('center', center)
        .eq('zone', zone)
        .eq('forecast_date', today)
        .single();

      if (briefing || forecast) {
        contextInfo = '\n\n**CURRENT AVALANCHE CONDITIONS CONTEXT**\n';
        contextInfo += `Location: ${zone}, ${center}\n`;
        contextInfo += `Date: ${today}\n\n`;

        if (forecast) {
          const dangerLevels: Record<string, string> = {
            '-1': 'No Rating',
            '1': 'Low',
            '2': 'Moderate',
            '3': 'Considerable',
            '4': 'High',
            '5': 'Extreme'
          };

          contextInfo += 'CURRENT DANGER LEVELS:\n';
          contextInfo += `- Overall: ${dangerLevels[forecast.danger_overall?.toString()] || 'Unknown'} (${forecast.danger_overall}/5)\n`;
          if (forecast.danger_high !== null) {
            contextInfo += `- Above Treeline: ${dangerLevels[forecast.danger_high.toString()] || 'Unknown'} (${forecast.danger_high}/5)\n`;
          }
          if (forecast.danger_middle !== null) {
            contextInfo += `- Near Treeline: ${dangerLevels[forecast.danger_middle.toString()] || 'Unknown'} (${forecast.danger_middle}/5)\n`;
          }
          if (forecast.danger_low !== null) {
            contextInfo += `- Below Treeline: ${dangerLevels[forecast.danger_low.toString()] || 'Unknown'} (${forecast.danger_low}/5)\n`;
          }
          if (forecast.travel_advice) {
            contextInfo += `\nOFFICIAL TRAVEL ADVICE:\n${forecast.travel_advice}\n`;
          }
        }

        if (briefing) {
          contextInfo += `\nAI BRIEFING SUMMARY:\n${briefing.briefing_text}\n`;

          if (briefing.problems && Array.isArray(briefing.problems) && briefing.problems.length > 0) {
            contextInfo += '\nIDENTIFIED AVALANCHE PROBLEMS:\n';
            briefing.problems.forEach((problem: any, index: number) => {
              contextInfo += `${index + 1}. ${problem.name} - ${problem.likelihood}, ${problem.size}\n`;
              contextInfo += `   ${problem.description}\n`;
            });
          }
        }
      }
    }

    // Initialize the Gemini model
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: `You are Scout AI, an expert backcountry avalanche safety assistant integrated into the SideCountry Scout app. Your role is to act as a cognitive bridge between complex, technical avalanche forecasts and sidecountry resort skiers who may lack formal avalanche training.

**Your Core Mission:**
- Help recreational skiers understand avalanche conditions in clear, accessible language
- Teach users about avalanche safety concepts through conversation
- Provide actionable terrain selection advice based on current conditions
- Use analogies and simple explanations to demystify technical avalanche terminology
- Be educational but not preachy - like a knowledgeable friend who cares about safety

**Communication Style:**
- Conversational and approachable, avoiding jargon unless you explain it
- Use practical examples and real-world scenarios
- When explaining danger levels, relate them to what terrain is appropriate
- Encourage safe decision-making while empowering users with knowledge
- If users ask about specific runs or terrain, provide thoughtful analysis based on aspect, elevation, and current problems

**Important Guidelines:**
- ALWAYS prioritize safety in your recommendations
- Explain the "why" behind conditions, not just the "what"
- If asked about specific terrain decisions, consider: aspect, elevation, recent weather, identified avalanche problems
- Teach users to recognize warning signs (whumpfing, shooting cracks, recent avalanche activity)
- Encourage conservative terrain choices when conditions are uncertain
- Remind users that avalanche forecasts are general guidance, not guarantees for specific slopes

**When You Have Context:**
${contextInfo ? 'You have been provided with the current avalanche forecast and briefing information below. Use this to provide specific, relevant advice about current conditions.' : 'If the user has selected a forecast location, you will receive current conditions. Otherwise, provide general avalanche safety education.'}
${contextInfo}

**Response Format:**
- Keep responses concise but informative (2-4 paragraphs max unless asked for detail)
- Break down complex topics into digestible pieces
- Use bullet points or numbered lists when explaining multiple concepts
- End with actionable advice when appropriate`
    });

    // Build conversation history for context
    const chatHistory = conversationHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Start chat with history
    const chat = model.startChat({
      history: chatHistory as any
    });

    // Send the user's message
    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    return NextResponse.json({
      success: true,
      response: responseText,
      hasContext: !!contextInfo
    });

  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process chat message'
      },
      { status: 500 }
    );
  }
}
