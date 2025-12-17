import crypto from "node:crypto";
import { FastifyPluginCallback } from "fastify";
import { prisma } from "../lib/prisma";
import { encryptString } from "../lib/crypto";
import { AccessibleResource, TokenResponse } from "../types/jira";

const requiredScopes = ["offline_access", "read:jira-user", "read:jira-work"];

// Temporary in-memory state store; replace with persistent store/session later.
const pendingStates = new Set<string>();

const jiraAuthRoutes: FastifyPluginCallback = (app, _opts, done) => {
  const clientId = process.env.JIRA_CLIENT_ID;
  const clientSecret = process.env.JIRA_CLIENT_SECRET;
  const redirectUri = process.env.JIRA_REDIRECT_URI;
  const encryptionKey = process.env.ENCRYPTION_KEY;

  if (!clientId || !clientSecret || !redirectUri) {
    app.log.warn(
      "Jira OAuth env vars missing; set JIRA_CLIENT_ID, JIRA_CLIENT_SECRET, JIRA_REDIRECT_URI"
    );
  }
  if (!encryptionKey) {
    app.log.warn("ENCRYPTION_KEY missing; secure token storage will fail");
  }

  app.get("/start", async (_request, reply) => {
    if (!clientId || !clientSecret || !redirectUri) {
      reply.code(500);
      return { error: "Jira OAuth is not configured on the server" };
    }

    const state = crypto.randomUUID();
    pendingStates.add(state);

    const authorizeUrl = new URL("https://auth.atlassian.com/authorize");
    authorizeUrl.searchParams.set("audience", "api.atlassian.com");
    authorizeUrl.searchParams.set("client_id", clientId);
    authorizeUrl.searchParams.set("scope", requiredScopes.join(" "));
    authorizeUrl.searchParams.set("redirect_uri", redirectUri);
    authorizeUrl.searchParams.set("state", state);
    authorizeUrl.searchParams.set("response_type", "code");
    authorizeUrl.searchParams.set("prompt", "consent");

    return reply.redirect(authorizeUrl.toString());
  });

  app.get("/callback", async (request, reply) => {
    if (!clientId || !clientSecret || !redirectUri) {
      reply.code(500);
      return { error: "Jira OAuth is not configured on the server" };
    }

    const { code, state } = request.query as { code?: string; state?: string };

    if (!code || !state) {
      reply.code(400);
      return { error: "Missing code or state" };
    }

    if (!pendingStates.has(state)) {
      reply.code(400);
      return { error: "Invalid state" };
    }

    pendingStates.delete(state);

    try {
      const tokenRes = await exchangeCodeForTokens({
        code,
        clientId,
        clientSecret,
        redirectUri
      });

      const resources = await fetchAccessibleResources(tokenRes.access_token);

      const returnedScopes = new Set(tokenRes.scope.split(" "));
      const missingScopes = requiredScopes.filter((s) => !returnedScopes.has(s));
      if (missingScopes.length > 0) {
        reply.code(400);
        return { error: "Missing required scopes", missingScopes };
      }

      if (!encryptionKey) {
        reply.code(500);
        return { error: "Server missing ENCRYPTION_KEY for token storage" };
      }

      const user = await prisma.user.upsert({
        where: { email: "local@example.com" },
        update: {},
        create: { email: "local@example.com" }
      });

      const primaryResource = resources[0];
      if (!primaryResource) {
        reply.code(400);
        return { error: "No accessible Jira resources returned" };
      }

      const expiresAt = new Date(Date.now() + tokenRes.expires_in * 1000);
      const accessEnc = encryptString(tokenRes.access_token);
      const refreshEnc = tokenRes.refresh_token
        ? encryptString(tokenRes.refresh_token)
        : null;

      const connection = await prisma.jiraConnection.create({
        data: {
          userId: user.id,
          cloudId: primaryResource.id,
          siteName: primaryResource.name,
          siteUrl: primaryResource.url,
          accessTokenEnc: JSON.stringify(accessEnc),
          refreshTokenEnc: refreshEnc ? JSON.stringify(refreshEnc) : null,
          scopes: Array.from(returnedScopes),
          tokenType: tokenRes.token_type,
          expiresAt
        }
      });

      return reply.type("application/json").send({
        connected: true,
        site: {
          id: primaryResource.id,
          name: primaryResource.name,
          url: primaryResource.url
        },
        connectionId: connection.id
      });
    } catch (err) {
      request.log.error({ err }, "Failed to complete Jira OAuth");
      reply.code(500);
      return { error: "Failed to complete Jira OAuth" };
    }
  });

  done();
};

async function exchangeCodeForTokens(params: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}): Promise<TokenResponse> {
  const res = await fetch("https://auth.atlassian.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: params.clientId,
      client_secret: params.clientSecret,
      code: params.code,
      redirect_uri: params.redirectUri
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${text}`);
  }

  return (await res.json()) as TokenResponse;
}

async function fetchAccessibleResources(
  accessToken: string
): Promise<AccessibleResource[]> {
  const res = await fetch(
    "https://api.atlassian.com/oauth/token/accessible-resources",
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to list accessible resources: ${res.status} ${text}`);
  }

  return (await res.json()) as AccessibleResource[];
}

export default jiraAuthRoutes;
