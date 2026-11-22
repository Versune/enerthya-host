import { and, desc, eq } from "drizzle-orm";
import type { Database } from "./client";
import { applicationInOrganization } from "./deployments";
import { applications, deployments, domains } from "./schema";

export type DomainSummary = {
  id: string;
  hostname: string;
  isPrimary: boolean;
  status: (typeof domains.$inferSelect)["status"];
};

export async function selectDomains(
  db: Database,
  organizationId: string,
  applicationId: string,
): Promise<DomainSummary[]> {
  if (!(await applicationInOrganization(db, organizationId, applicationId))) return [];
  return db
    .select({
      id: domains.id,
      hostname: domains.hostname,
      isPrimary: domains.isPrimary,
      status: domains.status,
    })
    .from(domains)
    .where(eq(domains.applicationId, applicationId))
    .orderBy(domains.hostname);
}

export async function insertDomain(
  db: Database,
  organizationId: string,
  input: { id: string; applicationId: string; hostname: string },
): Promise<boolean> {
  if (!(await applicationInOrganization(db, organizationId, input.applicationId))) return false;
  await db.insert(domains).values({
    id: input.id,
    applicationId: input.applicationId,
    hostname: input.hostname,
  });
  return true;
}

export async function deleteDomain(
  db: Database,
  organizationId: string,
  applicationId: string,
  id: string,
): Promise<boolean> {
  if (!(await applicationInOrganization(db, organizationId, applicationId))) return false;
  const rows = await db
    .delete(domains)
    .where(and(eq(domains.id, id), eq(domains.applicationId, applicationId)))
    .returning({ id: domains.id });
  return rows.length > 0;
}

/**
 * Whether any hostname points at this application. The worker asks before it
 * promises a swap without a gap: with a domain, the proxy is the thing that
 * moves the traffic, and a failed publish is a failed deployment.
 */
export async function applicationHasDomains(db: Database, applicationId: string): Promise<boolean> {
  const rows = await db
    .select({ id: domains.id })
    .from(domains)
    .where(eq(domains.applicationId, applicationId))
    .limit(1);
  return rows.length > 0;
}

export type DomainRoute = { hostname: string; port: number };

/**
 * Every domain whose application has a running deployment with a published
 * port. One route per application: the newest running deployment wins, which is
 * what the swap left serving.
 */
export async function selectDomainRoutes(db: Database): Promise<DomainRoute[]> {
  const rows = await db
    .select({
      hostname: domains.hostname,
      applicationId: domains.applicationId,
      port: deployments.hostPort,
    })
    .from(domains)
    .innerJoin(applications, eq(domains.applicationId, applications.id))
    .innerJoin(deployments, eq(deployments.applicationId, applications.id))
    .where(and(eq(deployments.status, "running")))
    .orderBy(desc(deployments.finishedAt));

  const newestPort = new Map<string, number>();
  for (const row of rows) {
    if (row.port !== null && !newestPort.has(row.applicationId)) {
      newestPort.set(row.applicationId, row.port);
    }
  }

  const routes: DomainRoute[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    const port = newestPort.get(row.applicationId);
    if (port === undefined || seen.has(row.hostname)) continue;
    seen.add(row.hostname);
    routes.push({ hostname: row.hostname, port });
  }
  return routes;
}
