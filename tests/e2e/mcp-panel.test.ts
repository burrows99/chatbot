import { expect, type Locator, type Page, test } from "@playwright/test";

const VALID_CUSTOM_CONFIG = JSON.stringify(
  {
    mcpServers: {
      acme: {
        url: "https://mcp.acme.example.com/mcp",
        headers: { Authorization: "Bearer token" },
      },
    },
  },
  null,
  2
);

const GITHUB_URL = "https://api.githubcopilot.com/mcp/";

async function readEditorValue(editor: Locator): Promise<string> {
  const value = await editor.getAttribute("data-mcp-value");
  return value ?? "";
}

async function setEditorValue(
  page: Page,
  editor: Locator,
  value: string
): Promise<void> {
  const content = editor.locator(".cm-content");
  await content.click({ force: true });
  await page.keyboard.press(
    process.platform === "darwin" ? "Meta+A" : "Control+A"
  );
  await page.keyboard.press("Delete");
  await page.keyboard.insertText(value);
}

async function openPanel(page: Page) {
  await page.getByTestId("mcp-panel-trigger").click();
}

async function switchToJsonTab(page: Page) {
  // Popover open animation can leave the trigger briefly "not stable"; the
  // tab button is plainly visible by the time we get here.
  await page.getByTestId("mcp-tab-json").click({ force: true });
}

test.describe("MCP Panel", () => {
  test.beforeEach(async ({ page }) => {
    // Clear before navigation so the React mount doesn't pick up state from
    // a prior test. addInitScript runs on every navigation; tests that need
    // post-reload persistence should set state inside the test rather than
    // relying on this cleanup.
    await page.addInitScript(() => {
      try {
        window.localStorage.removeItem("mcp-config");
      } catch {
        /* ignore */
      }
      // biome-ignore lint/suspicious/noDocumentCookie: test cleanup needs raw cookie write
      document.cookie = "mcp-config=; path=/; max-age=0";
    });

    // Stub the probe endpoint so tests don't depend on real network calls.
    await page.route("**/api/mcp/probe", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, tools: [] }),
      })
    );

    await page.goto("/");
  });

  test("trigger button is visible beside the model picker", async ({
    page,
  }) => {
    const mcpButton = page.getByTestId("mcp-panel-trigger");
    const modelButton = page.getByTestId("model-selector");

    await expect(mcpButton).toBeVisible();
    await expect(modelButton).toBeVisible();

    const mcpBox = await mcpButton.boundingBox();
    const modelBox = await modelButton.boundingBox();
    expect(mcpBox).not.toBeNull();
    expect(modelBox).not.toBeNull();
    if (mcpBox && modelBox) {
      const verticalOverlap = Math.abs(mcpBox.y - modelBox.y);
      expect(verticalOverlap).toBeLessThan(mcpBox.height);
    }
  });

  test("opens panel with two tabs (Servers + JSON), Servers default", async ({
    page,
  }) => {
    await openPanel(page);

    const serversTab = page.getByTestId("mcp-tab-servers");
    const jsonTab = page.getByTestId("mcp-tab-json");
    await expect(serversTab).toBeVisible();
    await expect(jsonTab).toBeVisible();

    // Servers tab content visible by default; JSON editor not yet mounted.
    await expect(page.getByTestId("mcp-servers-list")).toBeVisible();
    await expect(page.getByTestId("mcp-config-editor")).not.toBeVisible();
  });

  test("GitHub MCP server is seeded by default in Servers tab", async ({
    page,
  }) => {
    await openPanel(page);

    const card = page.getByTestId("mcp-server-card-github");
    await expect(card).toBeVisible();
    await expect(card.getByText(/github/i).first()).toBeVisible();
    await expect(card.getByText(GITHUB_URL)).toBeVisible();
    // Transport badge reflects HTTP transport from default config.
    await expect(card.getByTestId("mcp-server-transport")).toHaveText(/http/i);
  });

  test("JSON tab shows the GitHub-seeded config in the editor", async ({
    page,
  }) => {
    await openPanel(page);
    await switchToJsonTab(page);

    const editor = page.getByTestId("mcp-config-editor");
    await expect(editor).toBeVisible();
    const parsed = JSON.parse(await readEditorValue(editor));
    expect(parsed.mcpServers.github).toBeTruthy();
    expect(parsed.mcpServers.github.url).toBe(GITHUB_URL);
  });

  test("disconnect toggles status to Disconnected and shows Connect button", async ({
    page,
  }) => {
    await openPanel(page);

    const card = page.getByTestId("mcp-server-card-github");
    // Wait for the probe to settle before asserting or clicking.
    await expect(card.getByTestId("mcp-server-status")).toHaveText(
      /connected/i,
      { timeout: 5000 }
    );

    // Popover open animation can mark elements briefly "not stable"; force
    // the click after we've already asserted visibility above.
    await card.getByTestId("mcp-server-disconnect").click({ force: true });

    await expect(card.getByTestId("mcp-server-status")).toHaveText(
      /disconnected/i
    );
    await expect(card.getByTestId("mcp-server-connect")).toBeVisible();
  });

  test("connect after disconnect restores Connected state", async ({
    page,
  }) => {
    await openPanel(page);
    const card = page.getByTestId("mcp-server-card-github");

    await card.getByTestId("mcp-server-disconnect").click({ force: true });
    await expect(card.getByTestId("mcp-server-status")).toHaveText(
      /disconnected/i
    );

    await card.getByTestId("mcp-server-connect").click({ force: true });
    await expect(card.getByTestId("mcp-server-status")).toHaveText(
      /connected/i,
      { timeout: 5000 }
    );
  });

  test("reconnect button is visible while connected", async ({ page }) => {
    await openPanel(page);
    const card = page.getByTestId("mcp-server-card-github");
    // Wait for the background probe to settle to connected first.
    await expect(card.getByTestId("mcp-server-status")).toHaveText(
      /connected/i,
      { timeout: 5000 }
    );
    await expect(card.getByTestId("mcp-server-reconnect")).toBeVisible();
  });

  test("rejects invalid JSON in JSON tab and disables save", async ({
    page,
  }) => {
    await openPanel(page);
    await switchToJsonTab(page);
    const editor = page.getByTestId("mcp-config-editor");
    await setEditorValue(page, editor, "{ not valid json");

    await expect(page.getByTestId("mcp-config-error")).toBeVisible();
    await expect(page.getByTestId("mcp-config-save")).toBeDisabled();
  });

  test("rejects schema-invalid config (missing url) in JSON tab", async ({
    page,
  }) => {
    await openPanel(page);
    await switchToJsonTab(page);
    const editor = page.getByTestId("mcp-config-editor");
    await setEditorValue(
      page,
      editor,
      JSON.stringify({ mcpServers: { broken: { headers: {} } } })
    );

    await expect(page.getByTestId("mcp-config-error")).toBeVisible();
    await expect(page.getByTestId("mcp-config-save")).toBeDisabled();
  });

  test("shows masked token with show/hide toggle when server has Bearer header", async ({
    page,
  }) => {
    const SECRET = "github_pat_supersecrettoken123";
    const config = JSON.stringify(
      {
        mcpServers: {
          gh: {
            type: "http",
            url: "https://api.githubcopilot.com/mcp/",
            headers: { Authorization: `Bearer ${SECRET}` },
          },
        },
      },
      null,
      2
    );

    await openPanel(page);
    await switchToJsonTab(page);
    const editor = page.getByTestId("mcp-config-editor");
    await setEditorValue(page, editor, config);
    await expect.poll(async () => readEditorValue(editor)).toBe(config);
    await page.getByTestId("mcp-config-save").click({ force: true });

    // Reopen on Servers tab.
    await openPanel(page);
    const card = page.getByTestId("mcp-server-card-gh");
    await expect(card).toBeVisible();

    // Token row exists, with the header name visible.
    const tokenRow = card.getByTestId("mcp-server-token-row");
    await expect(tokenRow).toBeVisible();
    await expect(tokenRow.getByTestId("mcp-server-token-name")).toHaveText(
      /authorization/i
    );

    // Hidden by default — input is type="password" so the browser masks it.
    // The value attribute still holds the secret (so we can reveal without
    // re-entry), but the type prevents it from being rendered as plain text.
    const tokenValue = tokenRow.getByTestId("mcp-server-token-value");
    await expect(tokenValue).toBeVisible();
    await expect(tokenValue).toHaveAttribute("type", "password");
    await expect(tokenValue).toHaveValue(SECRET);

    // Toggle reveals the secret by switching the input type to text.
    const toggle = tokenRow.getByTestId("mcp-server-token-toggle");
    await toggle.click({ force: true });
    await expect(tokenValue).toHaveAttribute("type", "text");
    await expect(tokenValue).toHaveValue(SECRET);

    // Toggle again hides it.
    await toggle.click({ force: true });
    await expect(tokenValue).toHaveAttribute("type", "password");
  });

  test("does not render token row for servers without sensitive headers", async ({
    page,
  }) => {
    await openPanel(page);
    const card = page.getByTestId("mcp-server-card-github");
    await expect(card).toBeVisible();
    await expect(card.getByTestId("mcp-server-token-row")).toHaveCount(0);
  });

  test("saves custom config from JSON tab and Servers tab reflects it", async ({
    page,
  }) => {
    await openPanel(page);
    await switchToJsonTab(page);
    const editor = page.getByTestId("mcp-config-editor");
    await setEditorValue(page, editor, VALID_CUSTOM_CONFIG);

    await expect
      .poll(async () => readEditorValue(editor))
      .toBe(VALID_CUSTOM_CONFIG);

    const saveButton = page.getByTestId("mcp-config-save");
    await expect(saveButton).toBeEnabled();
    await saveButton.click({ force: true });

    // Editor closes after save.
    await expect(page.getByTestId("mcp-config-editor")).not.toBeVisible();

    // Reopen — Servers tab shows the new server, GitHub is gone.
    await openPanel(page);
    await expect(page.getByTestId("mcp-server-card-acme")).toBeVisible();
    await expect(page.getByTestId("mcp-server-card-github")).not.toBeVisible();

    const stored = await page.evaluate(() =>
      window.localStorage.getItem("mcp-config")
    );
    expect(JSON.parse(stored as string)).toEqual(
      JSON.parse(VALID_CUSTOM_CONFIG)
    );
  });
});
