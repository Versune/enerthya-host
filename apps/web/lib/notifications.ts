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

export type ChannelInput =
  | { name: string; type: "discord" | "webhook"; url: string }
  | { name: string; type: "email"; to: string };

export async function addChannel(organizationId: string, input: ChannelInput): Promise<void> {
  // The secret stays the destination only; SMTP settings live in the install's
  // environment, shared by every email channel.
  const config = input.type === "email" ? { to: input.to } : { url: input.url };
  await insertNotificationChannel(getDb(), {
    id: randomUUID(),
    organizationId,
    name: input.name,
    type: input.type,
    configEncrypted: encryptSecret(JSON.stringify(config)),
    events: ["deployment.failed"],
  });
}

export function removeChannel(organizationId: string, id: string): Promise<boolean> {
  return deleteNotificationChannel(getDb(), organizationId, id);
}
