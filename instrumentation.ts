export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.DD_TRACE_ENABLED !== "true") return;
  if (!process.env.DD_API_KEY) return;

  await import("dd-trace/init");
}
