/**
 * agent-skills.mjs: writes dist/.well-known/agent-skills/index.json, the
 * Agent Skills discovery index (https://github.com/cloudflare/agent-skills-discovery-rfc, v0.2.0).
 *
 * WHY THIS IS GENERATED
 * Every index entry carries the SHA-256 of its SKILL.md, and clients must
 * reject a skill whose bytes do not match. A hand-kept digest would go stale
 * the first time someone edited a skill and forgot to recompute it, which
 * silently breaks the skill for every client that verifies. The digest is
 * taken from the file in dist, the exact bytes the site serves.
 *
 * WHERE SKILLS LIVE
 * client/public/.well-known/agent-skills/<name>/SKILL.md, one folder per
 * skill. The name and description in the index come from each file's
 * frontmatter, so the folder is the only thing to edit.
 *
 * SAFETY
 * The build FAILS if a skill's frontmatter is not exactly
 *   name: <the folder name>
 *   description: "<one double-quoted line, 1 to 1024 characters>"
 * The strict form keeps the file valid YAML for every client without adding
 * a YAML parser here, and the name rules are the Agent Skills spec's.
 *
 * Usage: node scripts/agent-skills.mjs [distDir]   (default: dist)
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./routes.mjs";

const DIST = path.resolve(ROOT, process.argv[2] ?? "dist");
const DIR = path.join(DIST, ".well-known", "agent-skills");
const SCHEMA = "https://schemas.agentskills.io/discovery/0.2.0/schema.json";
const NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const log = (...a) => console.log("[agent-skills]", ...a);
const fail = (msg) => {
  console.error(`[agent-skills] ${msg}`);
  process.exit(1);
};

if (!fs.existsSync(DIR)) fail(`${path.relative(ROOT, DIR)} is missing. Did vite copy client/public?`);

const skills = fs
  .readdirSync(DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort()
  .map((folder) => {
    const file = path.join(DIR, folder, "SKILL.md");
    if (!fs.existsSync(file)) fail(`${folder}/ has no SKILL.md`);
    const bytes = fs.readFileSync(file);
    const fm = /^---\n([\s\S]*?)\n---\n/.exec(bytes.toString("utf8"));
    if (!fm) fail(`${folder}/SKILL.md has no frontmatter`);
    const lines = fm[1].split("\n");
    const name = /^name: (\S+)$/.exec(lines[0] ?? "")?.[1];
    const quoted = /^description: (".*")$/.exec(lines[1] ?? "")?.[1];
    if (lines.length !== 2 || !name || !quoted) {
      fail(`${folder}/SKILL.md frontmatter must be exactly a name: line and a double-quoted description: line`);
    }
    if (name !== folder) fail(`${folder}/SKILL.md says name: ${name}; it must match the folder`);
    if (name.length > 64 || !NAME_RE.test(name)) fail(`skill name "${name}" breaks the Agent Skills naming rules`);
    let description;
    try {
      description = JSON.parse(quoted);
    } catch {
      fail(`${folder}/SKILL.md description is not a valid double-quoted string`);
    }
    if (!description || description.length > 1024) fail(`${folder}/SKILL.md description must be 1 to 1024 characters`);
    return {
      name,
      type: "skill-md",
      description,
      url: `/.well-known/agent-skills/${name}/SKILL.md`,
      digest: `sha256:${crypto.createHash("sha256").update(bytes).digest("hex")}`,
    };
  });

if (!skills.length) fail("no skills found");
fs.writeFileSync(path.join(DIR, "index.json"), `${JSON.stringify({ $schema: SCHEMA, skills }, null, 2)}\n`);
log(`wrote index.json with ${skills.length} skills: ${skills.map((s) => s.name).join(", ")}`);
