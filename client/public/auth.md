# CairnCareers auth.md

How AI agents authenticate with cairncareers.com. Short version: they don't need to. Nothing public here takes a key, and there is no way for an agent to register or get credentials.

## Who this is for

Agents, crawlers and MCP clients reading or querying cairncareers.com on a person's behalf.

## Credentials

None. No endpoint issues or accepts API keys, OAuth tokens or client credentials. There is no OAuth authorization server, so there is no `/.well-known/oauth-protected-resource` or `/.well-known/oauth-authorization-server` document. Send requests without an `Authorization` header.

## Registration

There is no agent registration or provisioning endpoint. Do not look for `/agent/auth` or a similar path; none exists.

## What an agent can use without credentials

Read-only, safe to call freely:

- Every page as Markdown: send `Accept: text/markdown`, or add `.md` to the path (`/index.md` for the home page). Index: https://cairncareers.com/llms.txt
- MCP server: https://cairncareers.com/mcp (Streamable HTTP). Tools `list_pages`, `get_page` and `get_beta_count` only read. Server card: https://cairncareers.com/mcp/server-card
- `GET /api/beta-count` and `GET /api/health`
- Agent Skills index: https://cairncareers.com/.well-known/agent-skills/index.json

Rate limits are per IP: 60 requests a minute on `/mcp`, and 10 a minute shared by the two form endpoints below.

## Accounts for people

The product is in private beta. Beta accounts are for people and are set up by hand by the team; no endpoint creates one.

`POST /api/launch-notifications` signs an email address up and sends it an email. `POST /api/contact` sends a message the team reads. Only call them when the person whose email address you send has asked you to, and never to test them. Details: https://cairncareers.com/docs/api.md

## Machine-readable descriptions

- OpenAPI 3.1: https://cairncareers.com/openapi.json
- API catalog (RFC 9727): https://cairncareers.com/.well-known/api-catalog

Questions: https://cairncareers.com/contact
