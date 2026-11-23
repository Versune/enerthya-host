/**
 * The four steps a deployment is made of, and the decision that makes it
 * resumable: given what is already done, where does this run start?
 *
 * Kept apart from the pipeline on purpose. `runDeployment` needs a database, a
 * container runtime and a proxy; this needs none of them, so the rule that
 * decides "skip the image, it is built" is testable on its own.
 */
export const DEPLOY_STEPS = ["image", "container", "health", "swap"] as const;

export type DeployStep = (typeof DEPLOY_STEPS)[number];

export type StepRecord = { name: string; status: "pending" | "done" | "failed" };

/** The first step that has not finished, or null when the deployment is done. */
export function nextStep(steps: readonly StepRecord[]): DeployStep | null {
  for (const step of DEPLOY_STEPS) {
    const record = steps.find((candidate) => candidate.name === step);
    if (record?.status !== "done") return step;
  }
  return null;
}

export function isStepDone(steps: readonly StepRecord[], name: DeployStep): boolean {
  return steps.some((step) => step.name === name && step.status === "done");
}

/**
 * A deployment stuck in this run's own states was interrupted: the row says it
 * started and nothing says it finished. `queued` is the only state a fresh
 * request may claim, and `running` is a deployment that already serves.
 */
export function wasInterrupted(status: string): boolean {
  return status === "building" || status === "deploying" || status === "healthcheck";
}
