import { expect, type Locator, type Page, test } from "@playwright/test";

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

async function readEditorValue(editor: Locator): Promise<string> {
  // The editor exposes its current value via a data attribute that mirrors
  // the React draft state. This avoids parsing CodeMirror's rendered DOM,
  // which inserts zero-width chars and can mangle whitespace.
  const value = await editor.getAttribute("data-mcp-value");
  return value ?? "";
}

async function setEditorValue(
  page: Page,
  editor: Locator,
  value: string
): Promise<void> {
  const content = editor.locator(".cm-content");
  // The popover open animation can still be running here; force the click
  // through rather than wait out the radix transform animation.
  await content.click({ force: true });
  await page.keyboard.press(
    process.platform === "darwin" ? "Meta+A" : "Control+A"
  );
  await page.keyboard.press("Delete");
  // insertText pastes raw text and preserves newlines/whitespace exactly,
  // unlike .type() which fires per-key events that CM may auto-handle.
  await page.keyboard.insertText(value);
}

test.describe("MCP Panel", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
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
    // CodeMirror renders a contenteditable .cm-content node when mounted.
    await expect(editor.locator(".cm-content")).toBeVisible();
    await expect(page.getByTestId("mcp-config-save")).toBeVisible();
  });

  test("editor seeds with an empty mcpServers object by default", async ({
    page,
  }) => {
    await page.getByTestId("mcp-panel-trigger").click();
    const editor = page.getByTestId("mcp-config-editor");
    const value = await readEditorValue(editor);
    expect(JSON.parse(value)).toEqual({ mcpServers: {} });
  });

  test("rejects invalid JSON with an error and disables save", async ({
    page,
  }) => {
    await page.getByTestId("mcp-panel-trigger").click();
    const editor = page.getByTestId("mcp-config-editor");
    await setEditorValue(page, editor, "{ not valid json");

    await expect(page.getByTestId("mcp-config-error")).toBeVisible();
    await expect(page.getByTestId("mcp-config-save")).toBeDisabled();
  });

  test("saves valid config and persists across reload", async ({ page }) => {
    await page.getByTestId("mcp-panel-trigger").click();
    const editor = page.getByTestId("mcp-config-editor");
    await setEditorValue(page, editor, VALID_CONFIG);

    // Wait for the React state to mirror the editor value, otherwise the
    // save button can be re-rendered mid-click as draft updates settle.
    await expect
      .poll(async () => readEditorValue(editor))
      .toBe(VALID_CONFIG);

    const saveButton = page.getByTestId("mcp-config-save");
    await expect(saveButton).toBeEnabled();
    // CodeMirror dispatches asynchronous layout updates after typing that
    // make the popover briefly look "not stable". We've already asserted
    // enabled state above, so a forced click is safe here.
    await saveButton.click({ force: true });

    await expect(page.getByTestId("mcp-config-editor")).not.toBeVisible();

    const stored = await page.evaluate(() =>
      window.localStorage.getItem("mcp-config")
    );
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored as string)).toEqual(JSON.parse(VALID_CONFIG));

    await page.reload();
    await page.getByTestId("mcp-panel-trigger").click();
    const reopened = page.getByTestId("mcp-config-editor");
    await expect(reopened.locator(".cm-content")).toBeVisible();
    const reopenedValue = await readEditorValue(reopened);
    expect(JSON.parse(reopenedValue)).toEqual(JSON.parse(VALID_CONFIG));
  });

  test("rejects schema-invalid config (missing url)", async ({ page }) => {
    await page.getByTestId("mcp-panel-trigger").click();
    const editor = page.getByTestId("mcp-config-editor");
    await setEditorValue(
      page,
      editor,
      JSON.stringify({ mcpServers: { broken: { headers: {} } } })
    );

    await expect(page.getByTestId("mcp-config-error")).toBeVisible();
    await expect(page.getByTestId("mcp-config-save")).toBeDisabled();
  });
});
