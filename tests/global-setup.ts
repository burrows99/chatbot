import { MCP_TEST_PORT } from "./helpers/mcp-test-config";
import {
  type McpTestServerHandle,
  startMcpTestServer,
} from "./helpers/mcp-test-server";

declare global {
  // eslint-disable-next-line no-var
  var __MCP_TEST_SERVER__: McpTestServerHandle | undefined;
}

export default async function globalSetup() {
  if (!globalThis.__MCP_TEST_SERVER__) {
    globalThis.__MCP_TEST_SERVER__ = await startMcpTestServer(MCP_TEST_PORT);
  }
  return async () => {
    await globalThis.__MCP_TEST_SERVER__?.stop();
    globalThis.__MCP_TEST_SERVER__ = undefined;
  };
}
