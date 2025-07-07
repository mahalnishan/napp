const apiKey = process.env.GOOGLE_GEMINI_API_KEY

if (!apiKey) {
  console.warn('GOOGLE_GEMINI_API_KEY env var is missing. Gemini calls will fail.')
}

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[]
  error?: { message?: string }
}

/**
 * Ask Google Gemini via REST API (v1beta models/gemini-2.0-flash:generateContent)
 * Falls back to returning an error message on failure.
 */
export async function askGemini(prompt: string, model = 'gemini-2.0-flash'): Promise<string> {
  if (!apiKey) return 'Assistant unavailable: missing API key.'

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ]
        })
      }
    )

    const json = (await res.json()) as GeminiResponse

    if (json.error) {
      console.error('Gemini API error', json.error)
      return 'Sorry, the assistant encountered an error.'
    }

    const answer = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    return answer || 'No response.'
  } catch (err) {
    console.error('Gemini fetch error', err)
    return 'Network error while contacting assistant.'
  }
} 