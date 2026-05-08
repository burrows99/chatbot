import { createClient, type RedisClientType } from "redis";

type Client = ReturnType<typeof createClient>;

class RedisManager {
  private client: Client | null = null;
  private readonly url: string;

  constructor() {
    this.url = process.env.REDIS_URL ?? "redis://localhost:6379";
  }

  getClient(): Client | null {
    if (!this.client) {
      this.client = createClient({ url: this.url });
      this.client.on("error", () => undefined);
      this.client.connect().catch(() => {
        this.client = null;
      });
    }
    return this.client;
  }

  get isReady(): boolean {
    return (this.client as RedisClientType | null)?.isReady ?? false;
  }

  multi() {
    return this.getClient()?.multi();
  }
}

export const redis = new RedisManager();
