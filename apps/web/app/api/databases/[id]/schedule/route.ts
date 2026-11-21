import { roleAtLeast } from "@enerthya/core/roles";
import { currentOrganization } from "@/lib/current-org";
import { setDatabaseSchedule } from "@/lib/databases";
import { backupScheduleSchema } from "@/lib/validation/database";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await currentOrganization();
  if (!context) return Response.json({ error: "Not signed in" }, { status: 401 });
  if (!roleAtLeast(context.role, "admin")) {
    return Response.json({ error: "Your role cannot change backup schedules" }, { status: 403 });
  }

  const parsed = backupScheduleSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return Response.json({ error: first?.message ?? "Invalid schedule" }, { status: 400 });
  }

  const { id } = await params;
  try {
    await setDatabaseSchedule(context.organization.id, id, parsed.data);
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Database not found") {
      return Response.json({ error: "Database not found" }, { status: 404 });
    }
    throw error;
  }
}
