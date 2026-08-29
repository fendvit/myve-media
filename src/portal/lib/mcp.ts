// Minting side of the MCP tokens. The matching side lives in
// supabase/functions/portal-mcp/index.ts — both must hash identically
// (SHA-256 of the exact token string, lowercase hex) or nothing authenticates.

export const MCP_ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/portal-mcp`;

/** Characters of the plaintext kept in the clear so a row is identifiable. */
const HINT_LENGTH = 12;

/**
 * 32 random bytes, base64url. The `myve_` prefix is there so the string is
 * recognisable if it ever turns up somewhere it shouldn't — a config file in a
 * repo, a pasted screenshot — and can be grepped for.
 *
 * crypto.getRandomValues, not Math.random: this is a credential.
 */
export function generateMcpToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const base64 = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `myve_${base64}`;
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function tokenHint(token: string): string {
  return token.slice(0, HINT_LENGTH);
}

/** The `claude mcp add` line, ready to paste into PowerShell. */
export function claudeCodeCommand(token: string): string {
  return [
    "claude mcp add --transport http myve-portal `",
    `  ${MCP_ENDPOINT} \``,
    `  --header "Authorization: Bearer ${token}"`,
  ].join("\n");
}

/** The `.mcp.json` / claude_desktop_config.json fragment. */
export function claudeConfigJson(token: string): string {
  return JSON.stringify(
    {
      mcpServers: {
        "myve-portal": {
          type: "http",
          url: MCP_ENDPOINT,
          headers: { Authorization: `Bearer ${token}` },
        },
      },
    },
    null,
    2,
  );
}
