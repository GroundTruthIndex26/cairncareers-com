# Social links: UTM tags

Organic social only. There are no ad pixels on the site (Meta, TikTok, X, Reddit), and the privacy policy says personal information is not used for targeted advertising. Adding a pixel means rewriting that policy and adding a "Do Not Sell or Share" opt-out first.

## How a social visit is counted

Plausible and GA4 read the UTM tags on the landing URL and credit the visit to that source. When the visitor signs up, the site fires a conversion (`client/src/lib/analytics.ts`), which inherits the same source:

| Form | Plausible event | GA4 event |
|---|---|---|
| Launch list (home page modal) | `Signup`, prop `list=launch` | `generate_lead`, param `list=launch` |
| Beta request (home page) | `Signup`, prop `list=beta` | `generate_lead`, param `list=beta` |
| Contact page | `Contact` | `contact_submit` |

One-time setup, done by hand:

- Plausible: Site settings, Goals: add custom events `Signup` and `Contact`. Site settings, Custom properties: add `list`.
- GA4: Admin, Events: mark `generate_lead` as a key event.

`utm_medium=social` also switches the home page hero to its social headline.

## Link format

```
https://cairncareers.com/?utm_source=<network>&utm_medium=social&utm_campaign=<campaign>
```

- `utm_source`, lowercase: `facebook`, `instagram`, `tiktok`, `x`, `reddit`, `linkedin`, `bluesky`, `mastodon`, `pinterest`.
- `utm_medium`: always `social`. GA4 files that under Organic Social.
- `utm_campaign`: the batch or topic, lowercase with hyphens, e.g. `2026-10-batch` or `entry-level-hiring`.
- `utm_content` (optional): `bio` for a profile link, or a short post slug to tell two posts in one campaign apart.

## Profile links (set once)

Instagram and TikTok captions cannot hold a clickable link, so the profile link carries most of their traffic.

| Network | Profile link |
|---|---|
| Instagram | `https://cairncareers.com/?utm_source=instagram&utm_medium=social&utm_campaign=profile&utm_content=bio` |
| TikTok | `https://cairncareers.com/?utm_source=tiktok&utm_medium=social&utm_campaign=profile&utm_content=bio` |
| Facebook | `https://cairncareers.com/?utm_source=facebook&utm_medium=social&utm_campaign=profile&utm_content=bio` |
| X | `https://cairncareers.com/?utm_source=x&utm_medium=social&utm_campaign=profile&utm_content=bio` |
| Reddit | `https://cairncareers.com/?utm_source=reddit&utm_medium=social&utm_campaign=profile&utm_content=bio` |

## Posts that go to several networks at once

The Nuelink Short collection sends one text to X, Bluesky, and Mastodon, so a single `utm_source` cannot name the network. Leave links in that collection untagged. Plausible then falls back to the referrer, and X links arrive through t.co, which Plausible reports as X.

## Reddit

Reddit communities often remove posts with tracking parameters as spam. In a subreddit that does, post the bare URL; Plausible still reports the visit under Reddit from the referrer.
