import { expect, type Locator, type Page, test } from "@playwright/test";
import { MCP_TEST_URL } from "../helpers/mcp-test-config";

const REACHABLE_CONFIG = JSON.stringify(
  {
    mcpServers: {
      tester: { type: "http", url: MCP_TEST_URL },
    },
  },
  null,
  2
);

const UNREACHABLE_CONFIG = JSON.stringify(
  {
    mcpServers: {
      offline: { type: "http", url: "http://127.0.0.1:1/mcp" },
    },
  },
  null,
  2
);

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

async function saveCustomConfig(page: Page, value: string) {
  await page.getByTestId("mcp-panel-trigger").click();
  await page.getByTestId("mcp-tab-json").click({ force: true });
  const editor = page.getByTestId("mcp-config-editor");
  await setEditorValue(page, editor, value);
  await page.getByTestId("mcp-config-save").click({ force: true });
  await expect(page.getByTestId("mcp-config-editor")).not.toBeVisible();
}

test.describe("MCP Panel — real connection via /api/mcp/probe", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        window.localStorage.removeItem("mcp-config");
      } catch {
        /* ignore */
      }
      // biome-ignore lint/suspicious/noDocumentCookie: test cleanup
      document.cookie = "mcp-config=; path=/; max-age=0";
    });
    await page.goto("/");
  });

  test("Reconnect on a reachable server settles to Connected", async ({
    page,
  }) => {
    await saveCustomConfig(page, REACHABLE_CONFIG);

    await page.getByTestId("mcp-panel-trigger").click();
    const card = page.getByTestId("mcp-server-card-tester");
    await expect(card).toBeVisible();

    await card.getByTestId("mcp-server-reconnect").click({ force: true });

    // Final state must be Connected.
    await expect(card.getByTestId("mcp-server-status")).toHaveText(
      /connected/i,
      { timeout: 10_000 }
    );
  });

  test("Reconnect on an unreachable server settles to Error", async ({
    page,
  }) => {
    await saveCustomConfig(page, UNREACHABLE_CONFIG);

    await page.getByTestId("mcp-panel-trigger").click();
    const card = page.getByTestId("mcp-server-card-offline");
    await expect(card).toBeVisible();

    await card.getByTestId("mcp-server-reconnect").click({ force: true });

    await expect(card.getByTestId("mcp-server-status")).toHaveText(/error/i, {
      timeout: 10_000,
    });
  });

  test("Connect after disconnect against a reachable server returns to Connected", async ({
    page,
  }) => {
    await saveCustomConfig(page, REACHABLE_CONFIG);

    await page.getByTestId("mcp-panel-trigger").click();
    const card = page.getByTestId("mcp-server-card-tester");

    await card.getByTestId("mcp-server-disconnect").click({ force: true });
    await expect(card.getByTestId("mcp-server-status")).toHaveText(
      /disconnected/i
    );

    await card.getByTestId("mcp-server-connect").click({ force: true });
    await expect(card.getByTestId("mcp-server-status")).toHaveText(
      /connected/i,
      { timeout: 10_000 }
    );
  });
});
