#!/usr/bin/env node
/**
 * Quick validation script for Desktop Commander skills
 * Validates skill structure and frontmatter requirements.
 *
 * Usage:
 *   node validate-skill.mjs <skill_directory>
 *
 * Example:
 *   node validate-skill.mjs ~/.desktop-commander/skills/invoice-automation
 */

import { existsSync, readFileSync, statSync } from "fs";
import { createRequire } from "module";
import { join, resolve } from "path";

const patterns = {
    YAML_FRONTMATTER: /^---\r?\n([\s\S]*?)\r?\n---/,
    YAML_NAME: /name:\s*(.+?)\r?$/m,
    YAML_DESCRIPTION: /description:\s*(.+?)\r?$/m,
    GEMINI_VERSION: /gemini-(\d+(?:\.\d+)?)/,
    GLM_VERSION: /glm-(\d+(?:\.\d+)?)/,
    WSL_PATH: /^[/\\]{2}wsl[$.]|^[/\\]{2}wsl\.localhost/i,
    WINDOWS_ABSOLUTE_PATH: /^[a-zA-Z]:[\\\/]/,
    LEADING_SLASH_WINDOWS_PATH: /^\/[a-zA-Z]:/,
    VALID_ID_START: /^[a-zA-Z_]/,
    HYPHEN_CASE: /^[a-z0-9-]+$/,
};

function parseSkillFrontmatter(content) {
    const yamlMatch = content.match(patterns.YAML_FRONTMATTER);
    if (!yamlMatch) {
        return null;
    }

    const yamlContent = yamlMatch[1];
    const nameMatch = yamlContent.match(patterns.YAML_NAME);
    const descMatch = yamlContent.match(patterns.YAML_DESCRIPTION);

    return {
        name: nameMatch ? nameMatch[1].trim() : null,
        description: descMatch ? descMatch[1].trim() : null,
    };
}

/**
 * Validate a skill structure.
 * @param {string} skillPath - Path to skill directory
 * @returns {{valid: boolean, message: string}}
 */
function validateSkill(skillPath) {
    const resolvedPath = resolve(skillPath);

    // Check directory exists
    if (!existsSync(resolvedPath)) {
        return { valid: false, message: `Skill directory not found: ${resolvedPath}` };
    }

    if (!statSync(resolvedPath).isDirectory()) {
        return { valid: false, message: `Path is not a directory: ${resolvedPath}` };
    }

    // Check SKILL.md exists
    const skillMdPath = join(resolvedPath, "SKILL.md");
    if (!existsSync(skillMdPath)) {
        return { valid: false, message: "SKILL.md not found" };
    }

    // Read and validate frontmatter
    const content = readFileSync(skillMdPath, "utf-8");
    if (!content.startsWith("---")) {
        return { valid: false, message: "No YAML frontmatter found (must start with ---)" };
    }

    // Extract frontmatter using centralized helper
    const parsed = parseSkillFrontmatter(content);
    if (!parsed) {
        return { valid: false, message: "Invalid frontmatter format (missing closing ---)" };
    }

    // Check required fields
    if (!parsed.name) {
        return { valid: false, message: "Missing 'name' in frontmatter" };
    }
    if (!parsed.description) {
        return { valid: false, message: "Missing 'description' in frontmatter" };
    }

    // Validate name format
    const name = parsed.name;
    if (!patterns.HYPHEN_CASE.test(name)) {
        return {
            valid: false,
            message: `Name '${name}' should be hyphen-case (lowercase letters, digits, hyphens only)`,
        };
    }
    if (name.startsWith("-") || name.endsWith("-") || name.includes("--")) {
        return { valid: false, message: `Name '${name}' has invalid hyphen placement` };
    }

    // Validate description
    const description = parsed.description;
    if (description.includes("<") || description.includes(">")) {
        return { valid: false, message: "Description cannot contain angle brackets (< or >)" };
    }
    if (description.startsWith("[TODO")) {
        return { valid: false, message: "Description still contains TODO placeholder" };
    }

    return { valid: true, message: "✅ Skill is valid!" };
}

export { validateSkill };

function main() {
    const args = process.argv.slice(2);

    if (args.length !== 1 || args[0] === "--help" || args[0] === "-h") {
        console.log("Usage: node validate-skill.mjs <skill_directory>");
        console.log("\nExample:");
        console.log("  node validate-skill.mjs ~/.desktop-commander/skills/invoice-automation");
        process.exit(args.length === 0 ? 1 : 0);
    }

    const { valid, message } = validateSkill(args[0]);
    console.log(message);
    process.exit(valid ? 0 : 1);
}

// Only run main() when executed as a CLI script (not imported)
const isMainModule = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/"));
if (isMainModule) {
    main();
}
