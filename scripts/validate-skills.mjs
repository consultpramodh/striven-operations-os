import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const root = ".agents/skills";
const entries = await readdir(root, { withFileTypes: true });
const failures = [];

for (const entry of entries) {
  if (!entry.isDirectory()) continue;

  const skillPath = join(root, entry.name, "SKILL.md");
  let text;
  try {
    text = await readFile(skillPath, "utf8");
  } catch {
    failures.push(`${entry.name}: missing SKILL.md`);
    continue;
  }

  const match = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) {
    failures.push(`${entry.name}: missing YAML-style frontmatter block`);
    continue;
  }

  const frontmatter = match[1];
  const name = frontmatter.match(/^name:\s*(.+)$/m)?.[1]?.trim();
  const description = frontmatter.match(/^description:\s*(.+)$/m)?.[1]?.trim();

  if (!name) failures.push(`${entry.name}: missing name`);
  if (!description) failures.push(`${entry.name}: missing description`);
  if (name && name !== entry.name) {
    failures.push(`${entry.name}: frontmatter name must match directory name (got ${name})`);
  }
  if (description && description.length > 220) {
    failures.push(`${entry.name}: description is too long for reliable routing (${description.length} chars)`);
  }

  const dangerous = [
    /never ask.*permission/i,
    /bypass.*approval/i,
    /disable.*safety/i,
    /print.*secret/i,
    /exfiltrat/i,
  ];
  for (const pattern of dangerous) {
    if (pattern.test(text)) {
      failures.push(`${entry.name}: contains disallowed high-risk instruction pattern ${pattern}`);
    }
  }
}

if (failures.length) {
  console.error("Skill validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Validated ${entries.filter((entry) => entry.isDirectory()).length} skills.`);
