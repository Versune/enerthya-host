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

/** Every test gets a fresh context, so each signed-in test signs in itself. */
async function signIn(page: Page) {
  await page.goto("/sign-in");
  await waitForHydration(page);
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: ORGANIZATION })).toBeVisible();
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
      await signIn(page);
    });

    test("the shell moves between the workspace sections", async ({ page }) => {
      await signIn(page);

      await page.getByRole("link", { name: "Servers" }).click();
      await expect(page).toHaveURL(/\/servers$/);
      await expect(page.getByRole("heading", { name: "1 server." })).toBeVisible();
      await expect(page.getByText("This machine")).toBeVisible();

      await page.getByRole("link", { name: "Projects" }).click();
      await expect(page).toHaveURL(/\/projects$/);
      await expect(page.getByRole("heading", { name: "0 projects." })).toBeVisible();

      await page.getByRole("link", { name: "Deployments" }).click();
      await expect(page).toHaveURL(/\/deployments$/);
      await expect(page.getByRole("heading", { name: "Nothing has been deployed." })).toBeVisible();
    });

    test("a server can be added and removed", async ({ page }) => {
      await signIn(page);
      await page.goto("/servers");

      await page.locator("summary", { hasText: "Add a server" }).click();
      await expect(page.locator('form[data-hydrated="true"]')).toBeVisible();

      await page.getByLabel("Name", { exact: true }).fill("E2E Box");
      await page.getByLabel("Host", { exact: true }).fill("e2e.example.com");
      await page.getByLabel("Port").fill("2222");
      await page.getByLabel("SSH user").fill("deploy");
      await page
        .getByLabel("Private key")
        .fill("-----BEGIN OPENSSH PRIVATE KEY-----\ntest\n-----END-----");
      await page.getByRole("button", { name: "Add server" }).click();

      const row = page.locator(".server", { hasText: "E2E Box" });
      await expect(row).toBeVisible();
      await expect(row).toContainText("deploy@e2e.example.com:2222");
      await expect(row).toContainText("host key not pinned");

      await row.getByRole("button", { name: "Remove" }).click();
      await expect(page.getByText("E2E Box")).toHaveCount(0);
    });

    test("a project is born with production and staging", async ({ page }) => {
      await signIn(page);
      await page.goto("/projects");

      await page.locator("summary", { hasText: "Create a project" }).click();
      await expect(page.locator('form[data-hydrated="true"]')).toBeVisible();

      await page.getByLabel("Name", { exact: true }).fill("E2E Project");
      await page.getByRole("button", { name: "Create project" }).click();

      const row = page.locator(".project", { hasText: "E2E Project" });
      await expect(row).toBeVisible();
      await expect(row.locator(".env-chip")).toHaveText(["production", "staging"]);

      await row.getByRole("button", { name: "Remove" }).click();
      await expect(page.getByText("E2E Project")).toHaveCount(0);
    });

    test("an application is created inside an environment", async ({ page }) => {
      await signIn(page);

      await page.goto("/projects");
      await page.locator("summary", { hasText: "Create a project" }).click();
      await expect(page.locator('form[data-hydrated="true"]')).toBeVisible();
      await page.getByLabel("Name", { exact: true }).fill("App Project");
      await page.getByRole("button", { name: "Create project" }).click();
      await expect(page.getByText("App Project")).toBeVisible();

      await page.goto("/applications");
      await page.locator("summary", { hasText: "Create an application" }).click();
      await expect(page.locator('form[data-hydrated="true"]')).toBeVisible();

      await page.getByLabel("Name", { exact: true }).fill("E2E App");
      await page.getByLabel("Environment").selectOption({ label: "App Project · production" });
      await page.getByLabel("Repository").fill("https://github.com/example/app");
      await page.getByRole("button", { name: "Create application" }).click();

      const row = page.locator(".project", { hasText: "E2E App" });
      await expect(row).toBeVisible();
      await expect(row).toContainText("example/app");

      await row.getByRole("button", { name: "Remove" }).click();
      await expect(page.getByText("E2E App")).toHaveCount(0);

      // Leave the account with no projects so later tests see the empty state.
      await page.goto("/projects");
      const project = page.locator(".project", { hasText: "App Project" });
      await project.getByRole("button", { name: "Remove" }).click();
      await expect(page.getByText("App Project")).toHaveCount(0);
    });

    test("the command palette navigates with the keyboard", async ({ page }) => {
      await signIn(page);

      const trigger = page.locator(
        'button[aria-label="Open command palette"][data-hydrated="true"]',
      );
      await expect(trigger).toBeVisible();
      await trigger.click();
      const palette = page.getByRole("dialog", { name: "Command palette" });
      await expect(palette).toBeVisible();

      await page.getByLabel("Go to").fill("Projects");
      await page.keyboard.press("Enter");

      await expect(page).toHaveURL(/\/projects$/);
      await expect(page.getByRole("heading", { name: "0 projects." })).toBeVisible();
    });
  });

test("the servers API refuses anonymous writes", async ({ request }) => {
  const response = await request.post("/api/servers", { data: { name: "Nope" } });
  expect(response.status()).toBe(401);
});

test("dashboard routes send anonymous visitors to sign-in", async ({ page }) => {
  await page.goto("/deployments");
  await expect(page).toHaveURL(/\/sign-in$/);
});

test.describe("appearance", () => {
  test("dark is the default and the toggle survives a reload", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    await page.getByRole("button", { name: "Switch to light theme" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
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

  test("icons are served from public and linked in the head", async ({ page, request }) => {
    for (const asset of ["/icon.png", "/apple-icon.png"]) {
      const response = await request.get(asset);
      expect(response.ok(), asset).toBe(true);
      expect(response.headers()["content-type"], asset).toContain("image/png");
    }

    await page.goto("/sign-in");
    await expect(page.locator('link[rel="icon"]')).toHaveAttribute("href", "/icon.png");
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
      "href",
      "/apple-icon.png",
    );
  });

  test("robots.txt keeps the panel out of search engines", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.ok()).toBe(true);
    expect(await response.text()).toContain("Disallow: /");
  });

  test("sitemap.xml lists only the sessionless routes", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.ok()).toBe(true);

    const body = await response.text();
    expect(body).toContain("<urlset");
    expect(body).toContain("/sign-in");
    expect(body).not.toContain("/servers");
  });
});
