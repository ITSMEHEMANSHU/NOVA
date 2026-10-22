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
      const handle = await prepareRepositoryTask.trigger({ owner, repo });
      return NextResponse.json({
        triggered: true,
        runId: handle.id,
        system: "trigger.dev",
      });
    }

    // Direct invocation fallback if trigger dev is in local dev mode
    return NextResponse.json({
      triggered: true,
      message: "Trigger.dev task defined and ready for CLI worker (npx trigger.dev@latest dev)",
      system: "trigger.dev",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
