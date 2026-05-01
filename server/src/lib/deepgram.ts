import { DeepgramClient, Deepgram } from "@deepgram/sdk";
import { env } from "../config/env.js";

const client = new DeepgramClient({ apiKey: env.DEEPGRAM_API_KEY });

/**
 * Transcribes an audio/video file from a publicly accessible URL using
 * Deepgram's nova-3 model with speaker diarization.
 */
export async function transcribeAudio(audioUrl: string): Promise<{
  text: string;
  language?: string;
  meta: Record<string, unknown>;
}> {
  const response = (await client.listen.v1.media.transcribeUrl({
    url: audioUrl,
    model: "nova-3",
    detect_language: true,
    punctuate: true,
    paragraphs: true,
    smart_format: true,
    diarize: true,
    utterances: true,
  })) as Deepgram.ListenV1Response;

  const channel = response.results?.channels?.[0];
  const alternative = channel?.alternatives?.[0];
  const flatText = alternative?.transcript ?? "";
  const language = channel?.detected_language;

  const utterances = (
    response.results as {
      utterances?: Array<{
        speaker?: number;
        transcript?: string;
        start?: number;
      }>;
    }
  )?.utterances;

  let text = flatText;
  if (utterances && utterances.length > 0) {
    const turns: Array<{ speaker: number; start: number; parts: string[] }> = [];
    for (const u of utterances) {
      const t = (u.transcript ?? "").trim();
      if (!t) continue;
      const speaker = u.speaker ?? 0;
      const start = typeof u.start === "number" ? u.start : 0;
      const last = turns[turns.length - 1];
      if (last && last.speaker === speaker) {
        last.parts.push(t);
      } else {
        turns.push({ speaker, start, parts: [t] });
      }
    }
    if (turns.length > 0) {
      text = turns
        .map((turn) => {
          const m = Math.floor(turn.start / 60);
          const s = Math.floor(turn.start % 60);
          const ts = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
          return `Speaker ${turn.speaker} [${ts}]: ${turn.parts.join(" ")}`;
        })
        .join("\n\n");
    }
  }

  return {
    text,
    language: language || "en",
    meta: {
      request_id: response.metadata?.request_id,
      duration: response.metadata?.duration,
      confidence: alternative?.confidence,
      words: alternative?.words?.length ?? 0,
    },
  };
}
