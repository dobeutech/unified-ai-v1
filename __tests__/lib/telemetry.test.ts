import { afterEach, describe, expect, it, vi } from "vitest";
import { postToolCall } from "@/lib/telemetry";

describe("postToolCall", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("POSTs JSON to /api/tool-call and returns ok on 200", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, blocked: false }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const payload = {
      trace_id: "t1",
      session_id: "s1",
      tool_name: "TEST_TOOL",
    };
    const result = await postToolCall("https://app.example.com/", payload);

    expect(result).toEqual({ ok: true, blocked: false });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://app.example.com/api/tool-call");
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body as string);
    expect(body).toMatchObject({ channel: "cli", ...payload });
  });

  it("strips all trailing slashes from base URL", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      }),
    );

    await postToolCall("https://x.com///", {
      trace_id: "t",
      session_id: "s",
      tool_name: "T",
    });

    const fetchMock = vi.mocked(fetch);
    expect(fetchMock.mock.calls[0][0]).toBe("https://x.com/api/tool-call");
  });

  it("returns error when response is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        statusText: "Bad Request",
        json: async () => ({ error: "invalid" }),
      }),
    );

    const result = await postToolCall("http://localhost", {
      trace_id: "t",
      session_id: "s",
      tool_name: "T",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("invalid");
  });
});
