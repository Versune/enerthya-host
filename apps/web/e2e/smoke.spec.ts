import { expect, type Page, test } from "@playwright/test";

const STAMP = Date.now().toString(36);
const NAME = "E2E Admin";
const EMAIL = `e2e-${STAMP}@example.com`;
const PASSWORD = "correct horse battery staple";
const ORGANIZATION = `E2E Team ${STAMP}`;

/** A click before React hydrates is a native submit and reloads the page. */
async function waitForHydration(page: Page) {
  await expect(page.locator('form[data-hydrated="true"]')).toBeVisible();
}

test.describe
  .serial("accounts", () => {
    test("an anonymous visitor lands on sign-in", async ({ page }) => {
      await page.goto("/");

      await expect(page).toHaveURL(/\/sign-in$/);
      await expect(page.getByRole("heading", { name: "Sign in to this install." })).toBeVisible();
    });

    test("sign-up creates the account and its organization", async ({ page }) => {
      await page.goto("/sign-up");
      await waitForHydration(page);

      await page.getByLabel("Name", { exact: true }).fill(NAME);
      await page.getByLabel("Email").fill(EMAIL);
      await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
      await page.getByLabel("Organization").fill(ORGANIZATION);
      await page.getByRole("button", { name: "Create account" }).click();

      await expect(page.getByRole("heading", { name: ORGANIZATION })).toBeVisible();
      await expect(page.getByText(`Signed in as ${NAME}`)).toBeVisible();
    });

    test("signing out ends the session", async ({ page }) => {
      await page.goto("/sign-in");
      await waitForHydration(page);
      await page.getByLabel("Email").fill(EMAIL);
      await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
      await page.getByRole("button", { name: "Sign in" }).click();
      await expect(page.getByRole("heading", { name: ORGANIZATION })).toBeVisible();

      await page.getByRole("button", { name: "Sign out" }).click();
      await expect(page).toHaveURL(/\/sign-in$/);
    });

    test("a wrong password is refused", async ({ page }) => {
      await page.goto("/sign-in");
      await waitForHydration(page);
      await page.getByLabel("Email").fill(EMAIL);
      await page.getByLabel("Password", { exact: true }).fill("this is not the password");
      await page.getByRole("button", { name: "Sign in" }).click();

      await expect(page.getByText("The panel refused the request.")).toBeVisible();
      await expect(page).toHaveURL(/\/sign-in$/);
    });

    test("the right password signs in again", async ({ page }) => {
      await page.goto("/sign-in");
      await waitForHydration(page);
      await page.getByLabel("Email").fill(EMAIL);
      await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
      await page.getByRole("button", { name: "Sign in" }).click();

      await expect(page.getByRole("heading", { name: ORGANIZATION })).toBeVisible();
    });
  });

test.describe("services", () => {
  test("better-auth answers on its own route", async ({ request }) => {
    const response = await request.get("/api/auth/ok");
    expect(response.ok()).toBe(true);
    expect(await response.json()).toMatchObject({ ok: true });
  });

  test("health reports what the panel knows", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.ok()).toBe(true);

    const body = (await response.json()) as {
      status?: string;
      auth?: string;
      runtime?: { recommended?: string };
    };
    expect(body.status).toBe("ok");
    expect(body.auth).toBe("better-auth");
    expect(body.runtime?.recommended).toBeTruthy();
  });
});
