
/**
 * Safely parses JSON input, specifically designed to handle LLM outputs
 * which may contain Markdown code blocks (```json ... ```) or extraneous text.
 */
export const safeParseJSON = <T>(text: string | undefined): T | null => {
  if (!text) return null;

  try {
    // 1. Remove Markdown code blocks
    let clean = text.replace(/```json\n?|```/g, '').trim();

    // 2. Attempt direct parse
    return JSON.parse(clean);
  } catch (e) {
    // 3. Fallback: Try to find the first '{' or '[' and the last '}' or ']'
    try {
      const firstOpen = text.indexOf('{');
      const firstArray = text.indexOf('[');
      
      let start = -1;
      let end = -1;

      // Determine if it's likely an Object or Array
      if (firstOpen !== -1 && (firstArray === -1 || firstOpen < firstArray)) {
        start = firstOpen;
        end = text.lastIndexOf('}');
      } else if (firstArray !== -1) {
        start = firstArray;
        end = text.lastIndexOf(']');
      }

      if (start !== -1 && end !== -1) {
        const extracted = text.substring(start, end + 1);
        return JSON.parse(extracted);
      }
    } catch (retryError) {
      console.error("JSON Parse Error (Retry Failed):", retryError);
    }

    console.error("JSON Parse Error:", e);
    return null;
  }
};
