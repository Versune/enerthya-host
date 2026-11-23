import { describe, expect, it } from "vitest";
import {
  DEPLOY_STEPS,
  isStepDone,
  nextStep,
  type StepRecord,
  wasInterrupted,
} from "./deploy-steps";

const done = (...names: string[]): StepRecord[] =>
  names.map((name) => ({ name, status: "done" as const }));

describe("nextStep", () => {
  it("starts at the image when nothing has run", () => {
    expect(nextStep([])).toBe("image");
  });

  it("resumes at the first step that did not finish", () => {
    expect(nextStep(done("image"))).toBe("container");
    expect(nextStep(done("image", "container"))).toBe("health");
    expect(nextStep(done("image", "container", "health"))).toBe("swap");
  });

  it("reports nothing left when every step is done", () => {
    expect(nextStep(done(...DEPLOY_STEPS))).toBeNull();
  });

  it("treats a failed step as unfinished, not as done", () => {
    const steps: StepRecord[] = [
      { name: "image", status: "done" },
      { name: "container", status: "failed" },
    ];
    expect(nextStep(steps)).toBe("container");
    expect(isStepDone(steps, "container")).toBe(false);
  });

  it("ignores a record for a step that no longer exists", () => {
    expect(nextStep([{ name: "pull", status: "done" }])).toBe("image");
  });
});

describe("wasInterrupted", () => {
  it("recognises the states this run owns", () => {
    expect(wasInterrupted("building")).toBe(true);
    expect(wasInterrupted("deploying")).toBe(true);
    expect(wasInterrupted("healthcheck")).toBe(true);
  });

  it("leaves a fresh request and a serving deployment alone", () => {
    expect(wasInterrupted("queued")).toBe(false);
    expect(wasInterrupted("running")).toBe(false);
    expect(wasInterrupted("failed")).toBe(false);
  });
});
