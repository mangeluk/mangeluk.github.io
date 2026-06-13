// src/lib/commands/ai.ts
// `ask` command — integrates with Google Gemini AI with conversation history.
// Requirements: 13.1–13.5, 13.8

import { registerCommand } from './index';
import { askGemini, type ConversationMessage } from '@/lib/gemini';
import { profile } from '@/data/profile';

// Store conversation history in a module-level variable (reset on clear)
let conversationHistory: ConversationMessage[] = [];

// Command to reset conversation history
registerCommand({
  name: 'reset',
  description: 'reset — Reinicia la conversación con la IA / Reset the AI conversation',
  execute(_args, ctx) {
    conversationHistory = [];
    return {
      type: 'text',
      content:
        ctx.lang === 'en'
          ? 'Conversation history cleared. You can start a new conversation.'
          : 'Historial de conversación reiniciado. Puedes empezar una nueva conversación.',
    };
  },
});

// Main ask command
registerCommand({
  name: 'ask',
  description: 'ask <pregunta> — Chatea con la IA sobre el perfil / Chat with AI about the profile',
  execute(args, ctx) {
    const question = args[0]?.trim() ?? '';

    // Req. 13.5: return usage error when invoked without arguments
    if (!question) {
      return {
        type: 'error',
        content:
          ctx.lang === 'en'
            ? 'Usage: ask <question>  (e.g., ask What is your experience with React? | Use "reset" to clear history)'
            : 'Uso: ask <pregunta>  (ej: ask ¿Cuál es tu experiencia con React? | Usa "reset" para limpiar el historial)',
      };
    }

    // Req. 13.1–13.4, 13.8: async result with loader
    return {
      type: 'async',
      loader: ctx.lang === 'en' ? 'Thinking...' : 'Pensando...',
      promise: askGemini(question, profile, conversationHistory)
        .then(({ response, updatedHistory }) => {
          conversationHistory = updatedHistory;
          return { text: response };
        })
        .catch((err: Error) => {
          throw err;
        }),
    };
  },
});

// Export function to reset history (called from Terminal when clear is executed)
export function resetConversationHistory(): void {
  conversationHistory = [];
}
