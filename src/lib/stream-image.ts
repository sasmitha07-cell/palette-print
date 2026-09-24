import { createParser } from "eventsource-parser";
import { flushSync } from "react-dom";

export async function streamImage(
  prompt: string,
  onFrame: (dataUrl: string, isFinal: boolean) => void,
  signal?: AbortSignal,
  dna?: any,
  index?: number,
): Promise<void> {
  const res = await fetch("/api/ai-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, dna, index }),
    signal,
  });
  if (!res.ok || !res.body) {
    throw new Error(`Image generation failed: ${res.status}`);
  }
  let sawCompleted = false;
  let streamError: string | undefined;
  const parser = createParser({
    onEvent(event) {
      let payload: any;
      try {
        payload = JSON.parse(event.data);
      } catch {
        return;
      }
      if (event.event === "error" || payload?.type === "error") {
        streamError = payload?.error?.message ?? "Image generation failed";
        return;
      }
      if (
        event.event !== "image_generation.partial_image" &&
        event.event !== "image_generation.completed"
      )
        return;
      const isFinal = event.event === "image_generation.completed";
      const rawUrl = payload?.dataUrl || payload?.data_url;
      const b64 = payload?.b64_json;
      if (!rawUrl && !b64) return;
      const dataUrl =
        rawUrl ||
        (b64.startsWith("data:") ? b64 : `data:${payload?.mime_type || "image/png"};base64,${b64}`);
      flushSync(() => {
        onFrame(dataUrl, isFinal);
      });
      if (isFinal) sawCompleted = true;
    },
  });
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      parser.feed(value);
    }
  } finally {
    reader.cancel().catch(() => {});
  }
  if (streamError) throw new Error(streamError);
  if (!sawCompleted) throw new Error("Image stream ended without completion");
}
