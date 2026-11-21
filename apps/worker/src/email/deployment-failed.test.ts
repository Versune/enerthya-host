import { render } from "@react-email/render";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { DeploymentFailedEmail } from "./deployment-failed";

async function renderFailure(panelUrl?: string): Promise<string> {
  return render(
    createElement(DeploymentFailedEmail, {
      applicationName: "Storefront",
      error: "health check failed after 60s",
      deploymentId: "9e66b1a8-1f91-44d0-b56c-ccd9a7921047",
      panelUrl,
    }),
  );
}

describe("DeploymentFailedEmail", () => {
  it("carries the application, the error and the short deployment id", async () => {
    const html = await renderFailure();
    expect(html).toContain("Storefront");
    expect(html).toContain("health check failed after 60s");
    expect(html).toContain("9e66b1a8");
    expect(html).not.toContain("9e66b1a8-1f91");
  });

  it("links to the deployment only when the panel origin is known", async () => {
    expect(await renderFailure()).not.toContain("/deployments/");
    expect(await renderFailure("https://panel.example.com/")).toContain(
      "https://panel.example.com/deployments/9e66b1a8-1f91-44d0-b56c-ccd9a7921047",
    );
  });

  it("escapes what the deployment wrote", async () => {
    const html = await render(
      createElement(DeploymentFailedEmail, {
        applicationName: "<script>alert(1)</script>",
        error: "boom & <b>",
        deploymentId: "abc",
      }),
    );
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
