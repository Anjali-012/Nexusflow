import cron, { ScheduledTask } from "node-cron";
import { nanoid } from "nanoid";
import { Workflow } from "../src/models/workflow.model";
import { enqueueWorkflow } from "../src/lib/queue";
import logger from "../src/lib/logger";

interface ScheduledJob {
  workflowId: string;
  task: ScheduledTask;
}

const activeJobs = new Map<string, ScheduledJob>();

async function syncSchedules(): Promise<void> {
  const workflows = await Workflow.find({
    "trigger.type": "schedule",
    status: "active",
  }).select("_id tenantId trigger");

  const activeWorkflowIds = new Set(workflows.map((w) => w._id.toString()));

  // Remove jobs for workflows that are no longer active
  for (const [workflowId, job] of activeJobs.entries()) {
    if (!activeWorkflowIds.has(workflowId)) {
      job.task.stop();
      activeJobs.delete(workflowId);
      logger.info("Removed schedule job", { workflowId });
    }
  }

  // Add jobs for new active workflows
  for (const workflow of workflows) {
    const workflowId = workflow._id.toString();
    const cronExpr = workflow.trigger?.config?.cron as string;

    if (!cronExpr || activeJobs.has(workflowId)) continue;

    if (!cron.validate(cronExpr)) {
      logger.warn("Invalid cron expression", { workflowId, cronExpr });
      continue;
    }

    const task = cron.schedule(cronExpr, async () => {
      const correlationId = `schedule-${nanoid(12)}`;
      logger.info("Schedule trigger firing", { workflowId, correlationId });

      await enqueueWorkflow({
        workflowId,
        tenantId: workflow.tenantId.toString(),
        triggerPayload: { scheduledAt: new Date().toISOString() },
        correlationId,
        triggeredBy: "schedule",
      });
    });

    activeJobs.set(workflowId, { workflowId, task });
    logger.info("Registered schedule job", { workflowId, cronExpr });
  }
}

export async function startScheduler(): Promise<void> {
  logger.info("Scheduler started");

  // Initial sync
  await syncSchedules();

  // Re-sync every minute to pick up new/changed workflows
  cron.schedule("* * * * *", async () => {
    await syncSchedules();
  });
}
