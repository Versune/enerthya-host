import { sql } from "drizzle-orm";
import postgres from "postgres";
import type { Database } from "./client";

export type ChannelListener = {
  ready: Promise<void>;
  close: () => Promise<void>;
};

/** Holds one dedicated connection open and calls back for each notification. */
export function listenToChannel(
  databaseUrl: string,
  channel: string,
  onMessage: (payload: string) => void,
): ChannelListener {
  const client = postgres(databaseUrl, { max: 1 });
  let closed = false;

  const ready = client
    .listen(channel, (payload: string) => {
      if (!closed) onMessage(payload);
    })
    .then(() => undefined);

  return {
    ready,
    async close() {
      if (closed) return;
      closed = true;
      await ready.catch(() => undefined);
      await client.end({ timeout: 2 }).catch(() => undefined);
    },
  };
}

/** Notifies a channel. The channel name is a literal from our own code. */
export async function notifyChannel(db: Database, channel: string, payload: string): Promise<void> {
  await db.execute(sql`select pg_notify(${channel}, ${payload})`);
}
