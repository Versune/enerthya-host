import { randomUUID } from "node:crypto";
import { type DomainSummary, deleteDomain, getDb, insertDomain, selectDomains } from "@enerthya/db";

export type DomainRow = DomainSummary;

export function listDomains(organizationId: string, applicationId: string): Promise<DomainRow[]> {
  return selectDomains(getDb(), organizationId, applicationId);
}

export async function addDomain(
  organizationId: string,
  applicationId: string,
  hostname: string,
): Promise<void> {
  const stored = await insertDomain(getDb(), organizationId, {
    id: randomUUID(),
    applicationId,
    hostname,
  });
  if (!stored) throw new Error("Application not found");
}

export function removeDomain(
  organizationId: string,
  applicationId: string,
  id: string,
): Promise<boolean> {
  return deleteDomain(getDb(), organizationId, applicationId, id);
}
