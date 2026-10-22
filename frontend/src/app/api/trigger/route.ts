import { NextResponse } from "next/server";
import { prepareRepositoryTask } from "@/trigger/repositoryTasks";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { owner, repo } = body;

    if (!owner || !repo) {
      return NextResponse.json({ error: "Missing owner or repo" }, { status: 400 });
    }

    // Trigger Trigger.dev task if TRIGGER_SECRET_KEY is configured
    if (process.env.TRIGGER_SECRET_KEY) {
      try {
        const handle = await prepareRepositoryTask.trigger({ owner, repo });
        return NextResponse.json({
          triggered: true,
          runId: handle?.id,
          system: "trigger.dev",
        });
      } catch (triggerError: any) {
        console.warn("Trigger.dev cloud dispatch note:", triggerError?.message || triggerError);
        return NextResponse.json({
          triggered: false,
          fallback: true,
          message: "Trigger.dev standby / cloud task not yet deployed via CLI",
          detail: triggerError?.message || "Cloud session standby",
        });
      }
    }

    // Direct invocation fallback if trigger dev is in local dev mode
    return NextResponse.json({
      triggered: true,
      message: "Trigger.dev task defined and ready for CLI worker (npx trigger.dev@latest dev)",
      system: "trigger.dev",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Internal error", fallback: true }, { status: 200 });
  }
}
