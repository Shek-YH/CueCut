import type { ServerResponse } from "node:http";

export type SseEventName =
  | "ledger:snapshot"
  | "task:changed"
  | "event:appended"
  | "runtime:changed"
  | "error";

function frame(event: SseEventName, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export class SseHub {
  private readonly clients = new Map<string, Set<ServerResponse>>();

  public subscribe(projectId: string, response: ServerResponse): () => void {
    const clients = this.clients.get(projectId) ?? new Set<ServerResponse>();
    clients.add(response);
    this.clients.set(projectId, clients);

    return () => {
      clients.delete(response);
      if (clients.size === 0) this.clients.delete(projectId);
    };
  }

  public send(
    response: ServerResponse,
    event: SseEventName,
    data: unknown,
  ): void {
    if (!response.destroyed) response.write(frame(event, data));
  }

  public broadcast(projectId: string, event: SseEventName, data: unknown): void {
    const clients = this.clients.get(projectId);
    if (!clients) return;

    for (const response of clients) {
      if (response.destroyed || response.writableEnded) {
        clients.delete(response);
        continue;
      }
      response.write(frame(event, data));
    }
    if (clients.size === 0) this.clients.delete(projectId);
  }

  public close(): void {
    for (const clients of this.clients.values()) {
      for (const response of clients) response.end();
    }
    this.clients.clear();
  }
}
