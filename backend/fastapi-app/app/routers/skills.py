"""Skills registry router — exposes Antigravity skills for Paperclip agents.

Provides endpoints for listing and discovering available skills:
- Core skills in `.agents/skills/`
- Agency skills prefixed with `agency-`
- Secondary skills in `skills/`

This enables programmatic access to skills for Paperclip and other agent systems.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends

from app.auth import get_current_user

router = APIRouter(prefix="/skills", tags=["skills"])

# Base directories for skills
BASE_DIR = Path(__file__).parent.parent.parent.parent  # repo root
AGENTS_SKILLS_DIR = BASE_DIR / ".agents" / "skills"
SKILLS_DIR = BASE_DIR / "skills"


def _read_skill_frontmatter(skill_path: Path) -> dict[str, Any]:
    """Read skill frontmatter and content. Returns name, description, risk, source, date_added."""
    if not skill_path.exists():
        return {}

    content = skill_path.read_text(encoding="utf-8")
    frontmatter: dict[str, Any] = {}
    description = ""

    # Parse frontmatter
    if content.startswith("---\n"):
        lines = content.split("\n")
        end_idx = 1
        for i, line in enumerate(lines[1:], 1):
            if line.startswith("---"):
                end_idx = i
                break
            if ":" in line:
                key, _, value = line.partition(":")
                frontmatter[key.strip()] = value.strip().strip("'\"")

        # Get description from content after frontmatter
        remaining = "\n".join(lines[end_idx + 1 :])
        # Extract first paragraph as description
        desc_match = remaining.split("\n\n")
        if desc_match:
            # Get first heading if present
            for line in desc_match[0].split("\n"):
                if line.startswith("# "):
                    description = line[2:].strip()
                    break
            if not description:
                description = desc_match[0][:200].replace("\n", " ").strip()

    return {
        "name": frontmatter.get("name", skill_path.parent.name),
        "description": frontmatter.get("description", description),
        "risk": frontmatter.get("risk", "unknown"),
        "source": frontmatter.get("source", "unknown"),
        "date_added": frontmatter.get("date_added", "unknown"),
        "path": str(skill_path.relative_to(BASE_DIR)),
    }


def _list_skills_in_dir(dir_path: Path, prefix: str = "") -> list[dict[str, Any]]:
    """List all skills in a directory, returning frontmatter data."""
    skills = []

    if not dir_path.exists():
        return skills

    for entry in sorted(dir_path.iterdir()):
        if entry.is_dir() and entry.name.startswith(prefix):
            skill_file = entry / "SKILL.md"
            if skill_file.exists():
                skills.append(_read_skill_frontmatter(skill_file))

    return skills


@router.get("", summary="List all available skills")
async def list_skills(
    _current_user: None = Depends(get_current_user),
) -> dict[str, Any]:
    """Return all available Antigravity skills.

    Skills are organized into categories:
    - Core skills (in .agents/skills/)
    - Agency skills (prefixed with agency-, in .agents/skills/)
    - Secondary skills (in skills/)

    Returns skill metadata including name, description, risk level, and path.
    """
    core_skills = _list_skills_in_dir(AGENTS_SKILLS_DIR)

    # Separate core skills (non-agency) from agency skills
    core = [s for s in core_skills if not s.get("name", "").startswith("agency-")]
    agency = [s for s in core_skills if s.get("name", "").startswith("agency-")]
    secondary = _list_skills_in_dir(SKILLS_DIR)

    return {
        "core_skills": core,
        "agency_skills": agency,
        "secondary_skills": secondary,
        "counts": {
            "core": len(core),
            "agency": len(agency),
            "secondary": len(secondary),
            "total": len(core) + len(agency) + len(secondary),
        },
    }


@router.get("/agency", summary="List all Agency skills")
async def list_agency_skills(
    _current_user: None = Depends(get_current_user),
) -> dict[str, Any]:
    """Return all 184+ Agency skills with metadata.

    Agency skills are specialized AI agents for various business functions:
    - Engineering (30+ skills)
    - Design (21 skills)
    - Marketing (27 skills)
    - Sales (14 skills)
    - Product (6 skills)
    - Management (9 skills)
    - QA & Testing (5 skills)
    - Support (5 skills)
    - Finance (9 skills)
    - Specialized Domains (26 skills)
    - Game Development (20+ skills)
    - Retail & Customer Operations (3 skills)
    """
    agency = _list_skills_in_dir(AGENTS_SKILLS_DIR, prefix="agency-")

    # Categorize skills
    categories: dict[str, list[str]] = {
        "engineering": [],
        "design": [],
        "marketing": [],
        "sales": [],
        "product": [],
        "management": [],
        "testing": [],
        "support": [],
        "finance": [],
        "specialized": [],
        "game-dev": [],
        "retail-customer-operations": [],
    }

    engineering_keywords = [
        "frontend",
        "backend",
        "mobile",
        "devops",
        "ai-engineer",
        "api-tester",
        "code-reviewer",
        "database",
        "data-engineer",
        "mcp-builder",
        "security-engineer",
        "performance-benchmarker",
        "solid",
        "blockchain",
        "blender",
        "embedded",
        "git-workflow",
        "data-remediation",
        "automation-compliance",
        "autonomous-optimization",
        "lsp-index",
        "senior-developer",
        "unity",
        "unreal",
        "godot",
        "roblox",
        "macos-spatial",
        "terminal-integration",
    ]
    design_keywords = [
        "ui-designer",
        "ux-",
        "brand-guardian",
        "level-designer",
        "narrative-designer",
        "technical-artist",
        "game-audio",
        "visual-storyteller",
        "whimsy-injector",
        "unreal-world",
        "xr-interface",
        "visionos",
        "xr-immersive",
        "xr-cockpit",
        "roblox-avatar",
        "roblox-experience",
        "editor-tool",
        "unity-shader",
        "godot-shader",
        "technical-writer",
        "terminal-integration",
        "lsp-index",
    ]
    marketing_keywords = [
        "growth-hacker",
        "content-creator",
        "social-media",
        "ad-creative",
        "ppc-",
        "paid-",
        "programmatic",
        "search-query",
        "seo",
        "baidu-seo",
        "tiktok",
        "instagram",
        "twitter",
        "douyin",
        "kuaishou",
        "xiaohongshu",
        "weibo",
        "bilibili",
        "zhihu",
        "podcast",
        "video-optimization",
        "short-video",
        "carousel",
        "image-prompt",
        "ai-citation",
        "inclusive-visuals",
        "tracking-measurement",
        "trend-researcher",
        "cross-border-e-commerce",
    ]
    sales_keywords = [
        "outbound",
        "sales-",
        "deal-strategist",
        "pipeline-analyst",
        "account-strategist",
        "salesforce",
        "discovery-coach",
        "private-domain",
        "data-extraction",
        "report-distribution",
        "data-consolidation",
    ]
    product_keywords = [
        "product-manager",
        "sprint-prioritizer",
        "proposal-strategist",
        "experiment-tracker",
        "rapid-prototyper",
    ]
    management_keywords = [
        "project-shepherd",
        "studio-producer",
        "studio-operations",
        "chief-of-staff",
        "jira-workflow",
        "workflow-architect",
        "workflow-optimizer",
        "agents-orchestrator",
        "senior-project-manager",
    ]
    testing_keywords = [
        "reality-checker",
        "evidence-collector",
        "accessibility-auditor",
        "test-results-analyzer",
        "compliance-auditor",
    ]
    support_keywords = [
        "support-responder",
        "customer-service",
        "healthcare-customer",
        "analytics-reporter",
        "model-qa-specialist",
    ]
    finance_keywords = [
        "bookkeeper",
        "financial-analyst",
        "fp-a",
        "finance-tracker",
        "tax-strategist",
        "accounts-payable",
        "investment-researcher",
        "legal-billing",
    ]
    retail_keywords = ["retail-customer-returns", "hospitality-guest"]
    game_dev_keywords = ["game-", "unity-", "unreal-", "godot-", "roblox-"]

    for skill in agency:
        name = skill.get("name", "").lower()
        categorized = False
        for keyword in engineering_keywords:
            if keyword in name:
                categories["engineering"].append(name)
                categorized = True
                break
        if not categorized:
            for keyword in design_keywords:
                if keyword in name:
                    categories["design"].append(name)
                    categorized = True
                    break
        if not categorized:
            for keyword in marketing_keywords:
                if keyword in name:
                    categories["marketing"].append(name)
                    categorized = True
                    break
        if not categorized:
            for keyword in sales_keywords:
                if keyword in name:
                    categories["sales"].append(name)
                    categorized = True
                    break
        if not categorized:
            for keyword in product_keywords:
                if keyword in name:
                    categories["product"].append(name)
                    categorized = True
                    break
        if not categorized:
            for keyword in management_keywords:
                if keyword in name:
                    categories["management"].append(name)
                    categorized = True
                    break
        if not categorized:
            for keyword in testing_keywords:
                if keyword in name:
                    categories["testing"].append(name)
                    categorized = True
                    break
        if not categorized:
            for keyword in support_keywords:
                if keyword in name:
                    categories["support"].append(name)
                    categorized = True
                    break
        if not categorized:
            for keyword in finance_keywords:
                if keyword in name:
                    categories["finance"].append(name)
                    categorized = True
                    break
        if not categorized:
            for keyword in retail_keywords:
                if keyword in name:
                    categories["retail-customer-operations"].append(name)
                    categorized = True
                    break
        if not categorized:
            for keyword in game_dev_keywords:
                if keyword in name:
                    categories["game-dev"].append(name)
                    categorized = True
                    break
        if not categorized:
            categories["specialized"].append(name)

    return {
        "skills": agency,
        "categories": categories,
        "count": len(agency),
    }


@router.get("/agency/{skill_name}", summary="Get specific Agency skill details")
async def get_agency_skill(
    skill_name: str, _current_user: None = Depends(get_current_user)
) -> dict[str, Any]:
    """Return details for a specific Agency skill.

    Includes full frontmatter metadata and relative file path.
    """
    skill_path = AGENTS_SKILLS_DIR / skill_name / "SKILL.md"
    if not skill_path.exists():
        return {"error": "skill not found", "skill_name": skill_name}

    return _read_skill_frontmatter(skill_path)


@router.get("/core", summary="List core skills")
async def list_core_skills(
    _current_user: None = Depends(get_current_user),
) -> dict[str, Any]:
    """Return core Antigravity skills (non-agency).

    Core skills provide fundamental capabilities:
    - paperclip: Paperclip/API coordination
    - mission-control: Task tracking, agent reporting, status queries
    - payments: Square/Stripe payment processing
    - supabase: Supabase database, auth, edge functions
    - ui-ux-pro-max: UI/UX design across 10 stacks
    - devrel-content: Technical blogs/tutorials
    - growth-marketer: Growth marketing, funnels
    - hermes-evolution: Self-improving agents
    - sleek-design-mobile-apps: Mobile app design
    - social-growth-engineer: TikTok/Instagram growth
    """
    all_skills = _list_skills_in_dir(AGENTS_SKILLS_DIR)
    core = [s for s in all_skills if not s.get("name", "").startswith("agency-")]

    return {
        "skills": core,
        "count": len(core),
    }


@router.get("/self-improving-system/skills.md", summary="Get skills index markdown")
async def get_skills_index(
    _current_user: None = Depends(get_current_user),
) -> dict[str, Any]:
    """Return the skills.md index content for reducing context window usage.

    Points to file locations instead of embedding large skill text.
    """
    skills_md_path = SKILLS_DIR / "self-improving-system" / "skills.md"
    if not skills_md_path.exists():
        return {"error": "skills.md not found"}

    return {
        "content": skills_md_path.read_text(encoding="utf-8"),
        "path": str(skills_md_path.relative_to(BASE_DIR)),
    }
