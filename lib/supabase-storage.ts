/**
 * Supabase Storage client for uploading full chat transcripts.
 * Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY env vars.
 * Skips silently when env is not configured (chat must not fail).
 */

const BUCKET = "chat-transcripts";

interface ChatTurnPayload {
  traceId: string;
  sessionExternalId: string;
  channel: string;
  modelId: string;
  userText: string;
  assistantText: string;
  timestamp: string;
}

export async function uploadChatTranscript(
  payload: ChatTurnPayload,
): Promise<string | null> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;

  const path = `${payload.channel}/${payload.sessionExternalId}/${payload.traceId}.json`;
  const body = JSON.stringify(payload);

  try {
    const res = await fetch(
      `${supabaseUrl}/storage/v1/object/${BUCKET}/${path}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
          "x-upsert": "true",
        },
        body,
      },
    );

    if (!res.ok) {
      const text = await res.text();
      console.error(
        "[supabase-storage] Upload failed:",
        res.status,
        text.slice(0, 300),
      );
      return null;
    }

    return path;
  } catch (e) {
    console.error("[supabase-storage] Upload error:", e);
    return null;
  }
}
