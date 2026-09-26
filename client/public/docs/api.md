# CairnCareers public API

The endpoints behind the forms on cairncareers.com. They are public and need no key.

- Machine-readable spec (OpenAPI 3.1): https://cairncareers.com/openapi.json
- API catalog (RFC 9727): https://cairncareers.com/.well-known/api-catalog
- Health check: https://cairncareers.com/api/health

The two POST endpoints share a limit of 10 requests per minute per IP (429 past that) and reject bodies over 32 KB (413). Every error answers with `{"error": "..."}`, written to be shown to the person filling in the form.

## POST /api/launch-notifications

Sign up for launch news, or request beta access.

```json
{ "email": "you@example.com", "source": "beta-request" }
```

`source` is `launch-notification` (the default) or `beta-request`. Posting an address already on the launch list with `beta-request` moves it to the beta list. Answers `201 {"saved": true}` and sends one acknowledgment email.

## POST /api/contact

Send a message to the team.

```json
{ "name": "Ada", "email": "you@example.com", "subject": "Optional", "message": "Hello" }
```

`name`, `email` and `message` are required. Limits: name 200 characters, subject 300, message 5,000. Answers `201 {"saved": true}`.

## GET /api/beta-count

`{"count": 42}`: how many addresses have requested beta access. `count` is `null` below 10. Cached for 10 minutes.

## GET /api/health

`{"status": "ok"}` whenever the site is up.

## Questions

Email contact@cairncareers.com or use https://cairncareers.com/contact.
