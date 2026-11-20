import { expect, type Page, test } from "@playwright/test";

const USERNAME = "e2e-admin";
const PASSWORD = "correct horse battery staple";

/** A click before React hydrates is a native submit and reloads the page. */
async function waitForHydration(page: Page) {
  await expect(page.locator('form[data-hydrated="true"]')).toBeVisible();
}

test.describe
  .serial("first run", () => {
    test("the sign-in screen says no administrator exists", async ({ page }) => {
      await page.goto("/");

      await expect(page.getByRole("heading", { name: "Sign in to this install." })).toBeVisible();
      await expect(page.getByText("No administrator exists on this machine.")).toBeVisible();
      await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
    });

    test("the setup screen asks for a password twice", async ({ page }) => {
      await page.goto("/setup");

      await expect(page.getByRole("heading", { name: "Create the administrator." })).toBeVisible();
      await expect(page.getByLabel("Username")).toBeVisible();
      await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
      await expect(page.getByLabel("Confirm password")).toBeVisible();
    });

    test("setup creates the account and signs in", async ({ page }) => {
      await page.goto("/setup");
      await waitForHydration(page);
      await page.getByLabel("Username").fill(USERNAME);
      await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
      await page.getByLabel("Confirm password").fill(PASSWORD);
      await page.getByRole("button", { name: "Create account" }).click();

      await expect(page.getByRole("heading", { name: `Signed in as ${USERNAME}.` })).toBeVisible();
    });

    test("setup refuses a second administrator", async ({ page }) => {
      await page.goto("/setup");

      await expect(
        page.getByRole("heading", { name: "An administrator already exists." }),
      ).toBeVisible();
    });

    test("the account created in setup can sign in", async ({ page }) => {
      await page.goto("/");
      await waitForHydration(page);
      await page.getByLabel("Username").fill(USERNAME);
      await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
      await page.getByRole("button", { name: "Sign in" }).click();

      await expect(page.getByRole("heading", { name: `Signed in as ${USERNAME}.` })).toBeVisible();
    });

    test("health reports what the panel knows", async ({ request }) => {
      const response = await request.get("/api/health");
      expect(response.ok()).toBe(true);

      const body = (await response.json()) as {
        status?: string;
        runtime?: { recommended?: string };
      };
      expect(body.status).toBe("ok");
      expect(body.runtime?.recommended).toBeTruthy();
    });
  });
