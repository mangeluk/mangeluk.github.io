// src/lib/gemini.ts
// Gemini_Client: calls Google Gemini API for the `ask` command with conversation history.
// Requirements: 13.1, 13.4, 13.6, 13.7, 13.8

import type { ProfileData } from '@/data/profile';

const API_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export interface ConversationMessage {
  role: 'user' | 'model';
  text: string;
}

/**
 * Ask Gemini a question about the professional profile with conversation history.
 *
 * @throws Error immediately if NEXT_PUBLIC_GEMINI_KEY is absent (Req. 13.8)
 * @throws Error on network failure (Req. 13.4)
 * @throws Error on HTTP error response with status code (Req. 13.4)
 */
export async function askGemini(
  question: string,
  profileData: ProfileData,
  conversationHistory: ConversationMessage[] = []
): Promise<{ response: string; updatedHistory: ConversationMessage[] }> {
  // Req. 13.8: reject immediately if key is missing — no HTTP call
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_KEY;
  if (!apiKey || apiKey.trim() === '') {
    throw new Error(
      'Actualmente no disponible'
    );
  }

  // Req. 13.1, 13.6: system prompt with serialized profile and constraints
  const systemPrompt = `Eres un asistente que representa el portfolio profesional de Ángel.
Solo respondes preguntas relacionadas con el perfil profesional del candidato.
Si te preguntan algo no relacionado, redirige amablemente al perfil.
Limita cada respuesta a un máximo de 3 párrafos.
Si necesitas más contexto, pide aclaraciones.

Información del perfil (JSON):
${JSON.stringify(profileData, null, 2)}`;

  // Build contents array with conversation history
  const contents = conversationHistory.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }],
  }));
  
  // Add current user question
  contents.push({
    role: 'user',
    parts: [{ text: question }],
  });

  const url = `${API_ENDPOINT}?key=${apiKey}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
      }),
    });
  } catch (networkError) {
    // Req. 13.4: distinguish network errors from HTTP errors
    throw new Error('Error de red: no se pudo conectar con la IA. Verifica tu conexión a internet.');
  }

  if (!response.ok) {
    // Req. 13.4: include HTTP status code in error message
    let errorMsg = `Error de la API: HTTP ${response.status} — `;
    if (response.status === 400) {
      errorMsg += 'Solicitud inválida. Revisa los parámetros enviados.';
    } else if (response.status === 401) {
      errorMsg += 'API key inválida o expirada. Verifica tu configuración.';
    } else if (response.status === 403) {
      errorMsg += 'Acceso prohibido. Verifica que tu API key tenga permisos suficientes.';
    } else if (response.status === 429) {
      errorMsg += 'Demasiadas solicitudes. Por favor, inténtalo de nuevo más tarde.';
    } else if (response.status >= 500) {
      errorMsg += 'Error interno del servidor de Google. Por favor, inténtalo de nuevo más tarde.';
    } else {
      errorMsg += response.statusText;
    }
    throw new Error(errorMsg);
  }

  const data = await response.json();

  const text: string | undefined =
    data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('La IA no devolvió una respuesta válida. Por favor, inténtalo de nuevo.');
  }

  // Update conversation history with new messages
  const updatedHistory = [
    ...conversationHistory,
    { role: 'user' as const, text: question },
    { role: 'model' as const, text },
  ];

  return { response: text, updatedHistory };
}
