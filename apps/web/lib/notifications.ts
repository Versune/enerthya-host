import { randomUUID } from "node:crypto";
import { encryptSecret } from "@enerthya/core/crypto";
import {
  deleteNotificationChannel,
  getDb,
  insertNotificationChannel,
  type NotificationChannelSummary,
  selectNotificationChannels,
} from "@enerthya/db";

export type ChannelRow = NotificationChannelSummary;

export function listChannels(organizationId: string): Promise<ChannelRow[]> {
  return selectNotificationChannels(getDb(), organizationId);
}

export async function addChannel(
  organizationId: string,
  input: { name: string; type: "discord" | "webhook"; url: string },
): Promise<void> {
  await insertNotificationChannel(getDb(), {
    id: randomUUID(),
    organizationId,
    name: input.name,
    type: input.type,
    configEncrypted: encryptSecret(JSON.stringify({ url: input.url })),
    events: ["deployment.failed"],
  });
}

export function removeChannel(organizationId: string, id: string): Promise<boolean> {
  return deleteNotificationChannel(getDb(), organizationId, id);
}
