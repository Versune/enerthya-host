import { describe, expect, it } from "vitest";
import { formatNotice } from "./notify";

describe("formatNotice", () => {
  it("names the application, the reason and the deployment", () => {
    const text = formatNotice({
      applicationName: "Storefront",
      applicationId: "a",
      deploymentId: "12345678-90ab",
      error: "The build failed: no Dockerfile.",
    });
    expect(text).toBe(
      "Deployment failed: Storefront\nThe build failed: no Dockerfile.\ndeployment 12345678",
    );
  });
});
