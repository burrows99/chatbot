import { expect, test } from "@playwright/test";

const VALID_CONFIG = JSON.stringify(
  {
    mcpServers: {
      example: {
        url: "https://mcp.example.com/mcp",
        headers: { Authorization: "Bearer token" },
      },
    },
  },
  null,
  2
);

test.describe("MCP Panel", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Clear any persisted config from prior tests, then keep storage as-is
    // for the rest of the test (so reload assertions can verify persistence).
    await page.evaluate(() => {
      try {
        window.localStorage.removeItem("mcp-config");
      } catch {
        /* ignore */
      }
      // biome-ignore lint/suspicious/noDocumentCookie: test cleanup needs raw cookie write
      document.cookie = "mcp-config=; path=/; max-age=0";
    });
  });

  test("trigger button is visible beside the model picker", async ({
    page,
  }) => {
    const mcpButton = page.getByTestId("mcp-panel-trigger");
    const modelButton = page.getByTestId("model-selector");

    await expect(mcpButton).toBeVisible();
    await expect(modelButton).toBeVisible();

    // Trigger should sit in the same toolbar/footer row as the model picker.
    const mcpBox = await mcpButton.boundingBox();
    const modelBox = await modelButton.boundingBox();
    expect(mcpBox).not.toBeNull();
    expect(modelBox).not.toBeNull();
    if (mcpBox && modelBox) {
      const verticalOverlap = Math.abs(mcpBox.y - modelBox.y);
      expect(verticalOverlap).toBeLessThan(mcpBox.height);
    }
  });

  test("opens panel with JSON editor on click", async ({ page }) => {
    await page.getByTestId("mcp-panel-trigger").click();

    const editor = page.getByTestId("mcp-config-editor");
    await expect(editor).toBeVisible();
    await expect(page.getByTestId("mcp-config-save")).toBeVisible();
  });

  test("editor seeds with an empty mcpServers object by default", async ({
    page,
  }) => {
    await page.getByTestId("mcp-panel-trigger").click();
    const editor = page.getByTestId("mcp-config-editor");
    const value = await editor.inputValue();
    const parsed = JSON.parse(value);
    expect(parsed).toEqual({ mcpServers: {} });
  });

  test("rejects invalid JSON with an error and disables save", async ({
    page,
  }) => {
    await page.getByTestId("mcp-panel-trigger").click();
    const editor = page.getByTestId("mcp-config-editor");
    await editor.fill("{ not valid json");

    await expect(page.getByTestId("mcp-config-error")).toBeVisible();
    await expect(page.getByTestId("mcp-config-save")).toBeDisabled();
  });

  test("saves valid config and persists across reload", async ({ page }) => {
    await page.getByTestId("mcp-panel-trigger").click();
    await page.getByTestId("mcp-config-editor").fill(VALID_CONFIG);

    const saveButton = page.getByTestId("mcp-config-save");
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    // Editor closes after a successful save.
    await expect(page.getByTestId("mcp-config-editor")).not.toBeVisible();

    // Persistence: localStorage roundtrip.
    const stored = await page.evaluate(() =>
      window.localStorage.getItem("mcp-config")
    );
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored as string)).toEqual(JSON.parse(VALID_CONFIG));

    // Reload and reopen — the editor shows the saved value.
    await page.reload();
    await page.getByTestId("mcp-panel-trigger").click();
    const reopenedValue = await page
      .getByTestId("mcp-config-editor")
      .inputValue();
    expect(JSON.parse(reopenedValue)).toEqual(JSON.parse(VALID_CONFIG));
  });

  test("rejects schema-invalid config (missing url)", async ({ page }) => {
    await page.getByTestId("mcp-panel-trigger").click();
    await page.getByTestId("mcp-config-editor").fill(
      JSON.stringify({ mcpServers: { broken: { headers: {} } } })
    );

    await expect(page.getByTestId("mcp-config-error")).toBeVisible();
    await expect(page.getByTestId("mcp-config-save")).toBeDisabled();
  });
});
