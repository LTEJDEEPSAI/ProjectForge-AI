export function extractJson(content: string) {
  try {
    const match = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (match) return JSON.parse(match[1]);
    return JSON.parse(content);
  } catch (e) {
    console.error("JSON parsing failed for content:", content);
    throw new Error("AI returned malformed data.");
  }
}
