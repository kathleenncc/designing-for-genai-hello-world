export function captionSummary(prompt: string): string {
  const value = prompt.replace(/^\[Caption Studio\]\s*/, "");
  try {
    const saved = JSON.parse(value);
    if (saved.version !== 1 || typeof saved.userPrompt !== "string") return "Caption Studio";
    const input = JSON.parse(saved.userPrompt);
    return `${input.vibe} · ${input.length} · ${input.photoCount} photo${input.photoCount === 1 ? "" : "s"}${input.context ? ` · ${input.context}` : ""}`;
  } catch { return value; }
}
