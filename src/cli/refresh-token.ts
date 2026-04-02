import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

/**
 * Instagram Token Refresh Tool
 *
 * Exchanges a short-lived token (1 hour) from Graph API Explorer
 * for a long-lived token (60 days) using the Facebook OAuth flow.
 *
 * Requirements in .env:
 *   FACEBOOK_APP_ID     — from developers.facebook.com > Your App > Settings > Basic
 *   FACEBOOK_APP_SECRET — same page
 *
 * Usage:
 *   npx tsx src/cli/refresh-token.ts                      # interactive
 *   npx tsx src/cli/refresh-token.ts <short-lived-token>  # direct
 */

function ask(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

async function exchangeForLongLived(
  shortToken: string,
  appId: string,
  appSecret: string
): Promise<{ token: string; expiresIn: number }> {
  const url =
    `https://graph.facebook.com/v21.0/oauth/access_token` +
    `?grant_type=fb_exchange_token` +
    `&client_id=${appId}` +
    `&client_secret=${appSecret}` +
    `&fb_exchange_token=${shortToken}`;

  const res = await fetch(url);
  const data = (await res.json()) as Record<string, unknown>;

  if (data.error) {
    const err = data.error as Record<string, string>;
    throw new Error(err.message || "Token exchange failed");
  }

  return {
    token: data.access_token as string,
    expiresIn: (data.expires_in as number) || 0,
  };
}

async function testToken(token: string): Promise<{
  valid: boolean;
  pageName?: string;
  igUsername?: string;
  igFollowers?: number;
}> {
  const res = await fetch(
    `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,instagram_business_account&access_token=${token}`
  );
  const data = (await res.json()) as Record<string, unknown>;

  if (data.error) return { valid: false };

  const pages = (data.data as Array<Record<string, unknown>>) || [];
  if (pages.length === 0) return { valid: true };

  const page = pages[0];
  const igAccount = page.instagram_business_account as Record<string, string> | undefined;

  if (!igAccount?.id) return { valid: true, pageName: page.name as string };

  // Fetch IG details
  const igRes = await fetch(
    `https://graph.facebook.com/v21.0/${igAccount.id}?fields=username,followers_count&access_token=${token}`
  );
  const igData = (await igRes.json()) as Record<string, unknown>;

  return {
    valid: true,
    pageName: page.name as string,
    igUsername: (igData.username as string) || undefined,
    igFollowers: (igData.followers_count as number) || undefined,
  };
}

function updateEnvFile(envVar: string, newValue: string): void {
  const envPath = path.resolve(process.cwd(), ".env");
  let content = fs.readFileSync(envPath, "utf-8");

  const regex = new RegExp(`^${envVar}=.*$`, "m");
  if (regex.test(content)) {
    content = content.replace(regex, `${envVar}=${newValue}`);
  } else {
    content += `\n${envVar}=${newValue}\n`;
  }

  fs.writeFileSync(envPath, content);
}

async function main() {
  console.log("\n");
  console.log("  ┌──────────────────────────────────────────┐");
  console.log("  │   INSTAGRAM TOKEN REFRESH                │");
  console.log("  │                                          │");
  console.log("  │   Exchange 1-hour token → 60-day token   │");
  console.log("  └──────────────────────────────────────────┘");
  console.log("");

  const appId = process.env.FACEBOOK_APP_ID || "";
  const appSecret = process.env.FACEBOOK_APP_SECRET || "";

  if (!appId || !appSecret) {
    console.log("  Missing FACEBOOK_APP_ID or FACEBOOK_APP_SECRET in .env");
    console.log("");
    console.log("  To find these:");
    console.log("  1. Go to developers.facebook.com");
    console.log("  2. Select your app");
    console.log("  3. Settings > Basic");
    console.log("  4. Copy App ID and App Secret");
    console.log("  5. Add them to your .env file");
    console.log("");
    process.exit(1);
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // Get short-lived token (from args or prompt)
  let shortToken = process.argv[2] || "";
  if (!shortToken) {
    console.log("  Paste your short-lived token from Graph API Explorer:");
    console.log("  (Get one at: developers.facebook.com/tools/explorer)\n");
    shortToken = await ask(rl, "  Token: ");
  }

  if (!shortToken) {
    console.log("  No token provided. Exiting.");
    rl.close();
    process.exit(1);
  }

  // Test the short-lived token first
  console.log("\n  Testing token...");
  const testResult = await testToken(shortToken);

  if (!testResult.valid) {
    console.log("  Token is invalid or expired. Generate a fresh one from Graph API Explorer.");
    rl.close();
    process.exit(1);
  }

  const account = testResult.igUsername
    ? `@${testResult.igUsername} (${testResult.igFollowers?.toLocaleString()} followers)`
    : testResult.pageName || "Unknown account";

  console.log(`  Token works! Account: ${account}`);

  // Exchange for long-lived token
  console.log("  Exchanging for 60-day long-lived token...");
  try {
    const result = await exchangeForLongLived(shortToken, appId, appSecret);
    const days = Math.floor(result.expiresIn / 86400);

    console.log(`  Success! New token expires in ${days} days.`);

    // Determine which env var to save to
    let envVar = "";
    if (testResult.igUsername?.toLowerCase() === "roserenuu") {
      envVar = "INSTAGRAM_ROSERENUU_TOKEN";
    } else if (testResult.igUsername?.toLowerCase() === "jesusforeveryours") {
      envVar = "INSTAGRAM_JFY_TOKEN";
    } else {
      console.log(`\n  Which account is this for?`);
      console.log("  1. @roserenuu (INSTAGRAM_ROSERENUU_TOKEN)");
      console.log("  2. @jesusforeveryours (INSTAGRAM_JFY_TOKEN)");
      const choice = await ask(rl, "\n  Choice (1 or 2): ");
      envVar = choice === "2" ? "INSTAGRAM_JFY_TOKEN" : "INSTAGRAM_ROSERENUU_TOKEN";
    }

    // Save to .env
    updateEnvFile(envVar, result.token);
    console.log(`\n  Saved to .env as ${envVar}`);
    console.log(`  Expires: ${new Date(Date.now() + result.expiresIn * 1000).toLocaleDateString()}`);
    console.log("\n  Restart the app to use the new token. Then run /fetch.");
    console.log("");
  } catch (err) {
    console.log(`\n  Exchange failed: ${err instanceof Error ? err.message : err}`);
    console.log("\n  The short-lived token still works — saving it directly.");

    // Even if exchange fails, save the short-lived token so the user can at least use it now
    let envVar = "";
    if (testResult.igUsername?.toLowerCase() === "roserenuu") {
      envVar = "INSTAGRAM_ROSERENUU_TOKEN";
    } else if (testResult.igUsername?.toLowerCase() === "jesusforeveryours") {
      envVar = "INSTAGRAM_JFY_TOKEN";
    } else {
      console.log("  1. @roserenuu  2. @jesusforeveryours");
      const choice = await ask(rl, "  Choice (1 or 2): ");
      envVar = choice === "2" ? "INSTAGRAM_JFY_TOKEN" : "INSTAGRAM_ROSERENUU_TOKEN";
    }

    updateEnvFile(envVar, shortToken);
    console.log(`  Saved short-lived token to ${envVar} (expires in ~1 hour)`);
    console.log("  To get a 60-day token, add FACEBOOK_APP_ID and FACEBOOK_APP_SECRET to .env\n");
  }

  rl.close();
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
