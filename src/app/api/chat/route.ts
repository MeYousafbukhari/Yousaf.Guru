import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { SYSTEM_PROMPT } from './prompt';
import { getContact } from './tools/getContact';
import { getCrazy } from './tools/getCrazy';
import { getInternship } from './tools/getIntership';
import { getPresentation } from './tools/getPresentation';
import { getProjects } from './tools/getProjects';
import { getResume } from './tools/getResume';
import { getSkills } from './tools/getSkills';
import { getSports } from './tools/getSport';

// Configure Together.ai
const together = createOpenAI({
  baseURL: 'https://api.together.xyz/v1',
  apiKey: process.env.TOGETHER_API_KEY!,
});

export const maxDuration = 30;

// ❌ Pas besoin de l'export ici, Next.js n'aime pas ça
function errorHandler(error: unknown) {
  if (error == null) {
    return 'Unknown error';
  }
  if (typeof error === 'string') {
    // Check for Together.ai rate limit error
    if (error.includes('rate limit') && error.includes('together')) {
      return '⏳ You are sending messages too fast! Please slow down and wait a minute before trying again.';
    }
    return error;
  }
  if (error instanceof Error) {
    if (error.message.includes('rate limit') && error.message.includes('together')) {
      return '⏳ You are sending messages too fast! Please slow down and wait a minute before trying again.';
    }
    return error.message;
  }
  const str = JSON.stringify(error);
  if (str.includes('rate limit') && str.includes('together')) {
    return '⏳ You are sending messages too fast! Please slow down and wait a minute before trying again.';
  }
  return str;
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    console.log('[CHAT-API] Incoming messages:', messages);

    messages.unshift(SYSTEM_PROMPT);

    const tools = {
      getProjects,
      getPresentation,
      getResume,
      getContact,
      getSkills,
      getSports,
      getCrazy,
      getInternship,
    };

    const result = streamText({
      model: together('meta-llama/Llama-Vision-Free'),
      messages,
      toolCallStreaming: true,
      tools,
      maxSteps: 2,
    });

    return result.toDataStreamResponse({
      getErrorMessage: errorHandler,
    });
  } catch (err) {
    console.error('Global error:', err);
    const errorMessage = errorHandler(err);
    return new Response(errorMessage, { status: 500 });
  }
}
