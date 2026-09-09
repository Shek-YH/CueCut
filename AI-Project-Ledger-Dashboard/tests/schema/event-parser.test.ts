import { parseEventsJsonl } from "../../packages/ledger-schema/src/index.js";

describe("events.jsonl parser", () => {
  it("parses valid JSONL and ignores blank lines", () => {
    const events = parseEventsJsonl(
      [
        JSON.stringify({
          eventId: "evt-001",
          ts: "2026-09-08T13:38:22-04:00",
          type: "PROJECT_CREATED",
          actor: "codex",
          sessionId: null,
        }),
        "",
        JSON.stringify({
          eventId: "evt-002",
          ts: "2026-09-08T13:40:22-04:00",
          type: "TASK_COMPLETED",
          taskId: "T-001",
          actor: "codex",
          sessionId: "session-001",
        }),
      ].join("\n"),
    );

    expect(events).toHaveLength(2);
    expect(events[1]?.type).toBe("TASK_COMPLETED");
  });

  it("reports the line number for malformed or contract-invalid events", () => {
    expect(() =>
      parseEventsJsonl(
        [
          JSON.stringify({
            eventId: "evt-001",
            ts: "2026-09-08T13:38:22-04:00",
            type: "PROJECT_CREATED",
            actor: "codex",
            sessionId: null,
          }),
          "not-json",
        ].join("\n"),
      ),
    ).toThrow(/line 2/i);
  });
});
