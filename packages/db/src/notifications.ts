import { and, desc, eq } from "drizzle-orm";
import type { Database } from "./client";
import {
  applications,
  environments,
  notificationChannels,
  organizations,
  projects,
} from "./schema";

export type NotificationChannelSummary = {
  id: string;
  name: string;
  type: (typeof notificationChannels.$inferSelect)["type"];
  events: string[];
  enabled: boolean;
};

export type DeliveryTarget = {
  id: string;
  type: NotificationChannelSummary["type"];
  configEncrypted: string;
  events: string[];
};

export async function selectNotificationChannels(
  db: Database,
  organizationId: string,
): Promise<NotificationChannelSummary[]> {
  return db
    .select({
      id: notificationChannels.id,
      name: notificationChannels.name,
      type: notificationChannels.type,
      events: notificationChannels.events,
      enabled: notificationChannels.enabled,
    })
    .from(notificationChannels)
    .where(eq(notificationChannels.organizationId, organizationId))
    .orderBy(desc(notificationChannels.createdAt));
}

export async function insertNotificationChannel(
  db: Database,
  input: {
    id: string;
    organizationId: string;
    name: string;
    type: DeliveryTarget["type"];
    configEncrypted: string;
    events: string[];
  },
): Promise<void> {
  await db.insert(notificationChannels).values(input);
}

export async function deleteNotificationChannel(
  db: Database,
  organizationId: string,
  id: string,
): Promise<boolean> {
  const rows = await db
    .delete(notificationChannels)
    .where(
      and(eq(notificationChannels.id, id), eq(notificationChannels.organizationId, organizationId)),
    )
    .returning({ id: notificationChannels.id });
  return rows.length > 0;
}

/**
 * Delivery targets for one application: the enabled channels of its
 * organization, filtered to the channels that asked for this event.
 */
export async function selectDeliveryTargets(
  db: Database,
  applicationId: string,
  event: string,
): Promise<DeliveryTarget[]> {
  const rows = await db
    .select({
      id: notificationChannels.id,
      type: notificationChannels.type,
      configEncrypted: notificationChannels.configEncrypted,
      events: notificationChannels.events,
    })
    .from(notificationChannels)
    .innerJoin(organizations, eq(notificationChannels.organizationId, organizations.id))
    .innerJoin(projects, eq(projects.organizationId, organizations.id))
    .innerJoin(environments, eq(projects.id, environments.projectId))
    .innerJoin(applications, eq(environments.id, applications.environmentId))
    .where(and(eq(applications.id, applicationId), eq(notificationChannels.enabled, true)));

  return rows.filter((row) => row.events.includes(event));
}
