---
name: skill-creator
description: Guide for creating effective skills in Desktop Commander. Use this skill when users want to create a new skill, update an existing skill, or automate a repetitive workflow.
version: 1.6.1
---

# Skill Creator for Desktop Commander

This skill provides guidance for creating effective, reusable skills in Desktop Commander.

## Scripts

This skill includes helper scripts to streamline skill creation:

- [init-skill.mjs](scripts/init-skill.mjs) — Scaffold new skills with proper structure
- [validate-skill.mjs](scripts/validate-skill.mjs) — Validate structure and frontmatter

## About Skills

Skills are modular, self-contained packages that extend the AI's capabilities by providing specialized knowledge, workflows, and tools. Think of them as "onboarding guides" for specific domains or tasks—they transform a general-purpose assistant into a specialized agent equipped with procedural knowledge for specific workflows.

### What Skills Provide

1. **Specialized workflows** - Multi-step procedures for specific domains
2. **Tool integrations** - Instructions for working with specific file formats or APIs
3. **Domain expertise** - Company-specific knowledge, schemas, business logic
4. **Bundled resources** - Scripts, references, and assets for complex and repetitive tasks

### Where Skills Live

Skills are stored in `~/.agents/skills/`. The Desktop Commander app:
- Watches this directory for changes
- Shows available skills in the sidebar
- Injects skill metadata into conversations automatically

## Anatomy of a Skill

Every skill consists of a required SKILL.md file and optional bundled resources:

```
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter metadata (required)
│   │   ├── name: (required)
│   │   ├── description: (required)
│   │   └── version: (recommended)
│   └── Markdown instructions (required)
└── Bundled Resources (optional)
    ├── scripts/          - Executable code (Node.js/Bash/etc.)
    ├── references/       - Documentation loaded into context as needed
    └── assets/           - Files used in output (templates, icons, etc.)
```

### SKILL.md (required)

**Metadata Quality:** The `name` and `description` in YAML frontmatter determine when the skill gets used. Be specific about what the skill does and when to use it. Use third-person (e.g., "This skill should be used when..." instead of "Use this skill when..."). See [Writing Effective Descriptions](references/writing-effective-descriptions.md) for detailed guidance.

### Bundled Resources (optional)

#### Scripts (`scripts/`)

Executable code (Node.js/Bash/etc.) for tasks that require deterministic reliability or are repeatedly rewritten.

- **When to include**: When the same code is being rewritten repeatedly or deterministic reliability is needed
- **Example**: `scripts/rotate-pdf.mjs` for PDF rotation tasks
- **Benefits**: Token efficient, deterministic, can be executed without loading into context

#### References (`references/`)

Documentation and reference material intended to be loaded as needed into context.

- **When to include**: For documentation to reference while working
- **Examples**: `references/invoice-format.md` for invoice specifications, `references/api_docs.md` for API specifications
- **Best practice**: Keep SKILL.md lean; move detailed information to references files

#### Assets (`assets/`)

Files not intended to be loaded into context, but used in the generated output.

- **When to include**: When the skill needs files for the final output
- **Examples**: `assets/logo.png` for brand assets, `assets/template.xlsx` for spreadsheet templates

### Gradual Disclosure Pattern

Skills use a loading system to manage context efficiently:

1. **Metadata (name + description)** - Always in context (~100 tokens)
2. **SKILL.md body** - When skill triggers (<2k tokens ideal)
3. **References** - Loaded only when that specific situation arises

For complex skills, keep SKILL.md focused on the core workflow and link to sub-references.

### Linking Convention (Important!)

**Always use relative paths** when referencing scripts, references, or assets within a skill. This creates a navigable network where users previewing the skill can click links to explore sub-files.

Format links as standard markdown with relative paths from SKILL.md:

```markdown
## Scripts

- [generate_invoice.py](scripts/generate_invoice.py) - Main PDF generation script
- [validate_vat.py](scripts/validate_vat.py) - VAT number validation

## Sub-workflows

For Polish invoice requirements, see [Polish Invoice Format](references/polish-invoice-format.md)
For multi-currency handling, see [Multi-Currency Guide](references/multi-currency.md)
For embedding signatures, see [Signature Embedding](references/signature-embedding.md)

## Assets

This skill uses [company logo](assets/logo.png) and [invoice template](assets/template.xlsx)
```

**Why relative paths?**
- Users can click links in the preview to navigate between skill files
- Creates an Obsidian/Zettelkasten-style interconnected knowledge graph
- Each skill becomes a self-contained, explorable documentation set

**Path examples:**
- Script: `[script-name.py](scripts/script-name.py)`
- Reference: `[Reference Title](references/reference-name.md)`  
- Asset: `[asset description](assets/filename.ext)`
- Sub-skill: `[Sub-workflow](references/sub-workflow.md)`

This way only what's needed for each specific situation gets loaded, and users can explore the skill structure interactively.

## Skill Creation Process

Follow these steps in order when creating a new skill.

### Step 1: Understand the Workflow with Concrete Examples

To create an effective skill, clearly understand concrete examples of how the skill will be used.

Ask the user:
- "Can you walk me through exactly what you do step by step?"
- "What are the inputs you start with?"
- "What should the final output look like?"
- "Are there variations or edge cases?"

Conclude this step when there is a clear sense of the functionality the skill should support.

### Step 2: Plan the Skill Contents

Analyze what would be helpful when executing this workflow repeatedly:

1. **Scripts**: Is there code being rewritten each time? → Create a script
2. **References**: Is there documentation to reference while working? → Create reference files
3. **Assets**: Are there templates or files used in output? → Add to assets

Example analysis for an `invoice-pdf` skill:
- Creating invoices requires the same PDF generation code → create `scripts/generate_invoice.py`
- Polish invoice format has specific requirements → create `references/polish-format.md`
- Company logo needed in output → add `assets/logo.png`

Then in SKILL.md, reference these as **clickable markdown links** (not backticks):
- `[generate_invoice.py](scripts/generate_invoice.py)`
- `[Polish Format](references/polish-format.md)`
- `[logo](assets/logo.png)`

### Step 3: Create the Skill

**Always use the initializer script** to create new skills (don't hand-create folders):

```bash
node ~/.agents/skills/skill-creator/scripts/init-skill.mjs <skill-name>
```

This creates a consistent structure with SKILL.md template, example script, and all directories.

Then edit the generated SKILL.md with proper frontmatter:

```markdown
---
name: [skill-name]
description: [Clear description of what this skill does and when to use it]
version: 1.0.0
---

# [Skill Name]

[Brief overview of what this skill accomplishes]

## When to Use

[Specific triggers for when this skill applies]

## Workflow

[Step-by-step instructions for executing the workflow]

## Scripts

- [script-name.py](scripts/script-name.py) - [What it does]

## References

- [Reference Title](references/reference-name.md) - [When to use]

## Assets

Uses [template](assets/template.xlsx) for output generation.
```

### Step 4: Write the Skill Content

**Writing Style:** Use imperative/infinitive form (verb-first instructions), not second person. Use objective, instructional language (e.g., "To accomplish X, do Y" rather than "You should do X").

Answer these questions in the skill:
1. What is the purpose of the skill?
2. When should the skill be used?
3. How should the workflow be executed step by step?
4. What scripts, references, or assets should be used and when?

### Step 5: Validate the Skill

**Always run validation** after creating or editing a skill's SKILL.md:

```bash
node ~/.agents/skills/skill-creator/scripts/validate-skill.mjs ~/.agents/skills/<skill-name>
```

Fix any validation errors before proceeding. Only continue when you see "✅ Skill is valid!"

### Step 6: Test with User

After creating the skill, test it with the user's actual workflow:

1. Ask user to provide real inputs for their workflow
2. Execute the workflow using the new skill
3. Present the output to user
4. Ask: "Does this look right? Anything to adjust?"
5. Iterate until user confirms it works correctly

**Important**: Do not consider the skill complete until tested with real usage.

### Step 7: Explain to User

After the skill is ready, explain:

- "Your skill is saved at `~/.agents/skills/[name]/`"
- "You can see it in the Skills section of the sidebar"
- "Next time, just ask me to [description] and I'll use this skill automatically"
- "The skill will improve over time as we refine it"

## Updating Existing Skills

When updating a skill based on user feedback or corrections:

1. Identify what needs to change
2. Read the current SKILL.md
3. Make targeted updates (don't rewrite unnecessarily)
4. Test the updated skill with the original use case
5. Confirm with user that the issue is resolved

## Proactive Skill Improvement (Important!)

**Skills should improve automatically when issues are found.** Don't just fix the output file—fix the source.

### Mandatory Triggers

You MUST offer to update or auto-update the skill when ANY of these occur:

1. **Error in skill output** - User reports syntax error, rendering failure, or incorrect output from a skill-generated file
2. **Fix applied to output** - You make corrective edits to a file generated by a skill
3. **Iteration happens** - Even 1-2 back-and-forth corrections on skill output
4. **User points out pattern** - "This always happens" or "This is wrong again"

### Signal Quality Filter

Before proposing any skill update, validate the signal:

1. **Is it general?** Would this help in future uses, not just this one task?
2. **Is it durable?** Is this a stable preference, not a one-time exception?
3. **Is it actionable?** Can it be expressed as a clear instruction?
4. **Is it novel?** Is this specific to the user's setup, not general knowledge?

Only update skills when all four checks pass.

#### The "Novel Information" Test

Skills should capture knowledge specific to the user's setup and preferences:

**Worth adding to skills:**
- Specific formats, templates, naming conventions
- Where things live ("invoices go to ~/Documents/Invoices/YYYY/")
- Tool behaviors discovered through trial and error
- Workarounds for quirks in the workflow
- Preferences that differ from common defaults
- Recently changed tool behavior or new features

**Skip these (general knowledge):**
- Standard best practices for the domain
- Common tool usage documented everywhere
- Universal quality guidelines

**Simple test:** If any assistant would know this without being told, don't add it to the skill.

### Behavior: Intelligent Auto-Update

When a fix is **clearly general** (would benefit all future uses) AND passes the Signal Quality Filter, update the skill immediately and inform the user.

✅ Auto-update examples:
- Fixing output format issues that broke rendering
- Adding validation steps that caught errors
- Discovered workarounds for tool limitations
- New tool features or changed behavior you learned about

⚠️ Ask first examples:
- Style or formatting preferences
- Adding steps the user didn't request
- Changes that might affect other use cases

### Structured Proposal Format

For updates that aren't obvious wins, present a clear proposal before changing anything:

```
## Proposed Skill Update

**Skill:** [skill-name]
**Confidence:** HIGH | MEDIUM

**What triggered this:**
> [Quote or describe the correction/feedback]

**Proposed addition:**
> [The new instruction or information to add]

**Why this passes the filter:**
- General: [yes/no - applies beyond this task]
- Durable: [yes/no - stable preference]  
- Actionable: [yes/no - clear instruction]
- Novel: [yes/no - specific to user's setup, not general knowledge]

Apply? [y/n]
```

**HIGH confidence** (apply immediately, then inform):
- Clear error fixes
- User explicitly said "always" or "never"
- Discovered tool behavior that was breaking output

**MEDIUM confidence** (propose first, wait for approval):
- Style or format preferences
- Changes that might affect other use cases
- Anything you're unsure about

### Why This Matters

Skills are reusable knowledge. If we find a bug once, we should never hit it again. Fixing only the output is a missed opportunity—the same issue will recur for the next user or the next project.

**Think of skills like code:** when you fix a bug, you fix it in the source, not just patch the compiled output.

## Skill Quality Checklist

Before considering a skill complete, verify:

- [ ] Created with [init-skill.mjs](scripts/init-skill.mjs) for consistent structure
- [ ] YAML frontmatter has name, description, version
- [ ] Description clearly states when to use the skill
- [ ] Workflow steps are clear and actionable
- [ ] Any scripts are tested and working
- [ ] References use relative markdown links (e.g., `[name](references/file.md)`)
- [ ] Scripts use relative markdown links (e.g., `[name](scripts/file.mjs)`)
- [ ] Ran [validate-skill.mjs](scripts/validate-skill.mjs) and got "✅ Skill is valid!"
- [ ] Tested with user's actual workflow
- [ ] User confirmed output is correct

## Anti-Patterns to Avoid

❌ Overly broad skills ("do everything")
❌ Vague descriptions ("helps with documents")
❌ No concrete examples
❌ Loading everything into SKILL.md (use references for details)
❌ Using absolute paths or backtick-only references instead of clickable relative links
❌ Skipping user testing
❌ Assuming skill works without verification
❌ Copying entire skills to customize them (use extension pattern instead)
❌ Routing large templates through the LLM (use renderer scripts instead)
❌ Presenting output without validation (use fail-fast validators)
❌ Bloating skills with general knowledge (only add what's specific to the user's setup)

## Token Efficiency Principles (Important!)

Skills should minimize token usage. The biggest waste: **copying templates through the LLM**.

### The Problem: Template Copy-Through

Bad pattern:
1. Read `assets/template.html` into LLM context (hundreds of lines)
2. LLM rewrites whole file with placeholders filled
3. Write output file

This is expensive because templates are stable, static, and large. The model doesn't need to "think" about them.

### The Solution: Local Renderer Scripts

Instead of asking the LLM to copy templates, use a **renderer script**:

```
scripts/render-template.mjs
├── Reads template from assets/ (never enters LLM context)
├── Receives variable content via STDIN or arguments
├── Injects variables into template
└── Writes output file
```

**Example renderer pattern:**

```javascript
// scripts/render-template.mjs
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const template = readFileSync(join(__dirname, '../assets/template.html'), 'utf-8');

// Read variable content from STDIN
let input = '';
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  const { title, content, outputPath } = JSON.parse(input);
  const output = template
    .replace('{{TITLE}}', title)
    .replace('{{CONTENT}}', content);
  writeFileSync(outputPath, output);
  console.log(`Written to ${outputPath}`);
});
```

**Workflow in SKILL.md:**

```markdown
## Workflow

1. Generate the variable content (title, body, etc.)
2. Run renderer: `echo '{"title":"...","content":"...","outputPath":"..."}' | node scripts/render-template.mjs`
3. Validate output (see Fail-Fast Validation)
4. Return link to user
```

### When to Use Renderer Scripts

| Scenario | Use Renderer? |
|----------|---------------|
| HTML page with template | ✅ Yes |
| PDF from template | ✅ Yes |
| Markdown report with boilerplate | ✅ Yes |
| Small config file (<50 lines) | ❌ No, LLM is fine |
| Fully dynamic content (no template) | ❌ No |

## Fail-Fast Validation

**Always validate structured output before presenting it to the user.**

### The Problem

Skill generates HTML/JSON/Mermaid → returns link → user opens → syntax error → iteration loop.

### The Solution

Add a validator script that runs **before** declaring output "done":

```javascript
// scripts/validate-mermaid.mjs
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, unlinkSync } from 'fs';

const html = readFileSync(process.argv[2], 'utf-8');
const match = html.match(/<pre id="diagramDefinition"[^>]*>([\s\S]*?)<\/pre>/);
if (!match) {
  console.error('No Mermaid diagram found');
  process.exit(1);
}

const mermaidCode = match[1].trim();
const tempFile = '/tmp/validate.mmd';
writeFileSync(tempFile, mermaidCode);

try {
  execSync(`npx -y @mermaid-js/mermaid-cli -i ${tempFile} -o /tmp/validate.svg`, { stdio: 'pipe' });
  console.log('✓ Mermaid syntax valid');
  unlinkSync(tempFile);
} catch (e) {
  console.error('✗ Mermaid parse error:', e.stderr?.toString() || e.message);
  unlinkSync(tempFile);
  process.exit(1);
}
```

**Workflow with validation:**

```markdown
## Workflow

1. Generate output via renderer script
2. **Validate**: `node scripts/validate-mermaid.mjs output.html`
3. If validation fails → fix and retry
4. Only after validation passes → return link to user
```

### Common Validators

| Format | Validation Method |
|--------|-------------------|
| Mermaid | `npx @mermaid-js/mermaid-cli -i file.mmd` |
| JSON | `node -e "JSON.parse(require('fs').readFileSync('file.json'))"` |
| YAML | `npx yaml-lint file.yaml` |
| SQL | Database-specific linter or dry-run |
| HTML | `npx html-validate file.html` |

## Single Source of Truth

**Large payloads should exist once. Derive other outputs from that single source.**

### The Duplication Trap

Bad pattern:
1. Write Mermaid to `diagram.mmd` (payload #1)
2. Embed Mermaid into HTML (payload #2 - LLM emits it twice!)

### The Solution

Store data once, extract for validation:

```
output.html (contains Mermaid in <pre> tag)
    ↓
validator extracts Mermaid from HTML
    ↓
validates extracted content
```

**No duplication. Single source.**

### Decision Table: Where Does Content Go?

| Content Type | Location | Reasoning |
|--------------|----------|-----------|
| Large template (100+ lines) | `assets/` + renderer script | Never enters LLM context |
| Reference documentation | `references/` | Loaded only when needed |
| Generated output | Single file | Don't duplicate across files |
| Reusable code | `scripts/` | Execute, don't regenerate |
| Variable content | LLM generates | This is what LLM is for |

## Parse-Safe Generation Rules

**For sensitive parsers, document the safe subset of syntax.**

Some tools (Mermaid, regex, YAML) break on "normal-looking" characters. Skills should include parse-safe rules.

### Mermaid Example

Common Mermaid parse errors:

| Problem | Breaks | Fix |
|---------|--------|-----|
| Quotes in edge labels | `A -->\|Click "Sign in"\| B` | Remove quotes: `Click Sign in` |
| Literal `\n` in labels | `A -->\|Line1\nLine2\| B` | Use `<br/>` instead |
| Parentheses in labels | `(client_secret if confidential)` | Rewrite: `client_secret if confidential` |
| Label syntax on dotted arrows | `A -.->\|label\| B` | Use: `A -. label .-> B` |

**Add to skill:**

```markdown
## Parse-Safe Rules for Mermaid

When generating Mermaid diagrams:
- No quotes inside edge labels
- No literal \n - use <br/> for line breaks
- Avoid parentheses in labels - rewrite without them
- For dotted/dashed arrows, use inline label: `A -. label .-> B`
- When in doubt, simplify the label text
```

### General Pattern

For any sensitive parser, add a "Parse-Safe Rules" section to your skill:

1. Document characters/patterns that break
2. Show the fix for each
3. Provide "safe subset" examples
4. Default to simpler syntax

## Extending Skills (Zettelkasten Pattern)

**Never duplicate skills to customize them.** Instead, create extension skills that reference the original. This keeps things DRY (Don't Repeat Yourself) and allows base skills to update while preserving your customizations.

### Why Extend Rather Than Copy?

| Approach | Problem |
|----------|---------|
| Copy & modify | Base skill updates are lost; you maintain duplicate content |
| Extend & reference | Base updates flow through; you only maintain your delta |

### How to Extend a Skill

Create a new skill that references the original using `skill:` links:

```markdown
---
name: my-invoice-generator
description: My customized invoice generator with company-specific formatting. Extends the base invoice-generator skill.
version: 1.0.0
---

# My Invoice Generator

This skill extends [invoice-generator](skill:invoice-generator) with my company's requirements.

## Base Workflow

For the core invoice generation process, see [invoice-generator](skill:invoice-generator).

## My Customizations

### Company Branding
- Always use Acme Corp logo from `~/Documents/brand/logo.png`
- Footer text: "Thank you for your business - Acme Corp"

### Tax Handling
- Polish VAT: Apply 23% VAT rate
- EU customers: Reverse charge mechanism

### Output Location
- Save all invoices to `~/Documents/Invoices/YYYY/MM/`

## When to Use

Use this skill instead of base [invoice-generator](skill:invoice-generator) when creating invoices for Acme Corp.
```

### Extension Patterns

**Pattern 1: Add company-specific rules**
```markdown
Extends [skill-creator](skill:skill-creator) with our team's conventions:
- All skills must include version numbers
- Scripts must have error handling
- References must include "Last updated" dates
```

**Pattern 2: Specialize for a domain**
```markdown
Extends [data-analysis](skill:data-analysis) for financial data:
- Expect columns: Date, Amount, Category, Account
- Always check for currency formatting
- Generate monthly summaries
```

**Pattern 3: Add personal preferences**
```markdown
Extends [report-writer](skill:report-writer) with my style:
- Use British English spelling
- Maximum 2 pages unless specified
- Include executive summary first
```

### Bundled Skills

Some skills ship with Desktop Commander (marked with 🔒 in sidebar). These are:
- **Read-only**: Auto-updated with app updates
- **Designed for extension**: Create your own skill referencing them

To customize a bundled skill, use "Extend Skill" from the context menu, or create a new skill that references it with `[name](skill:bundled-skill-name)`.
