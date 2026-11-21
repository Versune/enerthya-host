import { roleAtLeast } from "@enerthya/core/roles";
import { currentOrganization } from "@/lib/current-org";
import { addChannel } from "@/lib/notifications";
import { firstIssue } from "@/lib/validation/auth";
import { notificationSchema } from "@/lib/validation/notification";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const context = await currentOrganization();
  if (!context) return Response.json({ error: "Not signed in" }, { status: 401 });
  if (!roleAtLeast(context.role, "admin")) {
    return Response.json({ error: "Your role cannot add channels" }, { status: 403 });
  }

  const parsed = notificationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: firstIssue(parsed.error) }, { status: 400 });

  await addChannel(context.organization.id, parsed.data);
  return Response.json({ name: parsed.data.name }, { status: 201 });
}
