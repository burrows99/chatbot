import { autoFixSpec, type Spec } from "@json-render/core";
import {
  renderToHtml,
  renderToPlainText,
} from "@json-render/react-email/render";
import { tool } from "ai";
import { z } from "zod";

const COMPONENT_GUIDE = `Available email components (use as the \`type\` field of each element):
- Html (props: lang, dir) — root document
- Head — metadata container
- Body (props: style) — visible body wrapper
- Container, Section, Row, Column (props: style) — layout primitives
- Heading (props: text, as: "h1"–"h6", style) — section titles
- Text (props: text, style) — paragraphs
- Link (props: text, href, style) — hyperlinks
- Button (props: text, href, style) — call-to-action button
- Image (props: src, alt, width, height, style)
- Hr (props: style) — horizontal rule
- Preview (props: text) — preheader text shown by email clients
- Markdown (props: content) — render markdown into email-safe HTML

Spec format (same as the canvas catalog):
{ "root": "<rootKey>", "elements": { "<key>": { "type": "<Component>", "props": {...}, "children": ["<childKey>", ...] } } }

The root element should be type "Html" with a "Head" and "Body" child. Inside Body, use a Container, then Sections.`;

export const draftEmail = tool({
  description: `Render a transactional email to HTML + plain-text. Use this whenever the user asks to draft, compose, write, or prepare an email.

After this tool returns successfully, you should follow up by calling a Gmail (or other email) MCP \`create_draft\` tool with:
- to: same recipients
- subject: same subject
- body / htmlBody: the returned \`html\` field

${COMPONENT_GUIDE}`,
  inputSchema: z.object({
    to: z.array(z.email()).min(1).describe("Recipient email addresses"),
    subject: z.string().min(1).describe("Email subject line"),
    spec: z
      .any()
      .describe(
        "A json-render Spec object ({ root, elements }) built from the email components listed above"
      ),
  }),
  execute: async ({ to, subject, spec }) => {
    const { spec: fixed } = autoFixSpec(spec as Spec);
    try {
      const [html, plainText] = await Promise.all([
        renderToHtml(fixed),
        renderToPlainText(fixed),
      ]);
      return { ok: true as const, to, subject, html, plainText };
    } catch (err) {
      return {
        ok: false as const,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  },
});
