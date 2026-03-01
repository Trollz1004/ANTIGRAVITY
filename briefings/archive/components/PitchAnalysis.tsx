import { useState } from "react";

const CATEGORIES = [
  {
    id: "hook",
    name: "The Hook",
    icon: "🎯",
    score: 5,
    maxScore: 10,
    verdict: "Needs sharpening",
    analysis:
      "Your opening has mission-driven passion, but investors get 5,000 decks a year and spend ~2 minutes each. The opening buries the lead — 'Built by an electrician using AI collaboration tools' is your HOOK, not your footnote. The 100% charity angle is rare and powerful, but it competes with too many ideas on the first pass.",
    fixes: [
      "Lead with: 'An electrician built a dating app with AI — and every dollar from the AI tools goes to kids in medical need. Forever.'",
      "One sentence. One slide. Make them feel something before you explain anything.",
      "Move 'THREE INTEGRATED PRODUCTS' out of the opening — it dilutes focus.",
    ],
    bestInClass: "Airbnb's seed deck opened with 3 words: 'Book rooms with locals.' You understood instantly.",
  },
  {
    id: "problem",
    name: "Problem Statement",
    icon: "🔥",
    score: 4,
    maxScore: 10,
    verdict: "Missing entirely",
    analysis:
      "This is the single biggest gap. There's no dedicated problem slide. Investors use the 'Hearts → Minds → Wallets' framework: first make them CARE about the problem, then explain your solution, then show why it's investable. Right now you jump straight to the platform overview without establishing why the world needs this.",
    fixes: [
      "Add a Problem slide: '83% of dating app users say profiles feel fake. Meanwhile, $3B in charity donations are lost to opaque operations. We solve both.'",
      "Use a real stat or user quote to make the pain visceral.",
      "Frame it as TWO intersecting problems: broken dating + broken charity transparency.",
    ],
    bestInClass: "Buffer's deck showed the exact user pain ('scheduling social posts takes too long') with data backing it up.",
  },
  {
    id: "solution",
    name: "Solution Clarity",
    icon: "💡",
    score: 6,
    maxScore: 10,
    verdict: "Good but scattered",
    analysis:
      "You have three products described well, but the pitch tries to sell all three equally. The 'scattered deck' problem is a top killer — investors want to see ONE sharp wedge into the market, not a portfolio. YouAndINotAI should be the hero; the AI tools and charity DAO are the flywheel.",
    fixes: [
      "Restructure: YouAndINotAI is the ENGINE, AI-Solutions.Store is the CHARITY MACHINE, AidoesItall is the EDUCATION HUB.",
      "One visual showing the money flow: Dating → Revenue → AI Tools → 100% to Kids. That's your 'aha' moment.",
      "Cut product descriptions to 1 sentence each. Save details for the appendix.",
    ],
    bestInClass: "Dropbox's demo video explained the entire product in 90 seconds. Your ecosystem needs a similar 'one-image' explanation.",
  },
  {
    id: "market",
    name: "Market Opportunity",
    icon: "📊",
    score: 7,
    maxScore: 10,
    verdict: "Strong data, weak framing",
    analysis:
      "You cite real market sizes ($5.6B dating, $50B AI tools) which is good. But you're missing the TAM → SAM → SOM funnel that investors expect. Also, the 'dating app fatigue' insight in your 'Why Now' section is GOLD — it should be front and center in market sizing, not buried at the end.",
    fixes: [
      "Build a proper TAM/SAM/SOM: TAM = $5.6B dating market → SAM = $200M 'authentic dating' niche → SOM = $2M first-year target from 2,000 founding members.",
      "Move 'Dating App Fatigue (2026 Trend)' to the market slide — it's your timing wedge.",
      "Add one competitor comparison showing your unique positioning (authenticity + charity).",
    ],
    bestInClass: "Klue's deck nailed TAM/SAM/SOM with a bottom-up approach and made it visually exciting.",
  },
  {
    id: "traction",
    name: "Traction & Proof",
    icon: "📈",
    score: 6,
    maxScore: 10,
    verdict: "Underplayed",
    analysis:
      "You mention $30K+ reinvested and $3K-$6K monthly revenue — that's REAL traction for a bootstrapped startup! But it's buried in a table. Traction is what makes investors lean forward. Buffer raised $500K on the back of 55K users and $150K ARR displayed prominently. Your live systems, Stripe approval, and existing revenue deserve a spotlight.",
    fixes: [
      "Create a dedicated 'Traction' slide: '$30K+ self-funded and reinvested. 3 live products. Stripe approved. Revenue generating.'",
      "Add a timeline visual: Idea → Built → Live → Revenue → [YOU ARE HERE] → Scale.",
      "Include any user metrics: signups, waitlist size, social followers, engagement.",
    ],
    bestInClass: "Buffer's traction slide (55K users, $150K ARR) was the single most convincing element of their entire deck.",
  },
  {
    id: "business_model",
    name: "Business Model",
    icon: "💰",
    score: 7,
    maxScore: 10,
    verdict: "Clear but complex",
    analysis:
      "The 60/30/10 split and DAO structure are well-defined. The pricing tiers make sense. But the complexity of three products with different revenue models (founder-funded vs. 100% charity vs. educational) could confuse investors in a 2-minute scan. The immutable DAO is a STRENGTH — it signals conviction. Make it simpler to grasp.",
    fixes: [
      "One-slide visual: Revenue funnel showing $ flowing from each product to its destination.",
      "Simplify to: 'Dating app pays the bills. AI tools fund the kids. Forever locked by smart contract.'",
      "Address the elephant: How does the founder sustain long-term? Investors need to see this is viable, not martyrdom.",
    ],
    bestInClass: "Coinrule's pricing page screenshot was their entire business model slide. Clean, immediate, credible.",
  },
  {
    id: "team",
    name: "Team & Credibility",
    icon: "👤",
    score: 5,
    maxScore: 10,
    verdict: "Authentic but thin",
    analysis:
      "The 'electrician who codes' story is genuinely compelling and memorable — that's rare. But the deck lists AI tools as the 'team,' which reads as a solo founder with chatbots. Investors bet on teams. You need to show advisors, planned hires, or strategic partners to de-risk the 'bus factor.'",
    fixes: [
      "Reframe: 'Founder + AI Collaboration' is the story, but add: planned first hire, advisory board targets, or charity partner contacts.",
      "Your electrician background IS a superpower: 'I understand code — electrical code, building code, and now software code.' Use this line.",
      "Add: 'With AI handling 90% of routine ops, one founder can operate what traditionally requires a team of 5.'",
    ],
    bestInClass: "Solo founders who raised successfully always showed advisors, planned hires, or domain expertise that de-risked the bet.",
  },
  {
    id: "ask",
    name: "The Ask",
    icon: "🤝",
    score: 5,
    maxScore: 10,
    verdict: "Too vague",
    analysis:
      "The $50K-$250K range is too wide. 'Optional seed funding' signals uncertainty about whether you even want investment. Investors want conviction: a specific number, a specific use, and a specific outcome. Your 'Conservative (no funding needed)' option actually undermines the pitch — if you don't need money, why are you pitching?",
    fixes: [
      "Pick ONE number: '$100K to acquire 5,000 users in 6 months' or '$50K to hire a growth marketer and hit $25K MRR by Q3.'",
      "Remove 'no outside funding needed' — if you're pitching, commit to the pitch.",
      "Show expected ROI: '$100K investment → projected $500K annual revenue within 18 months → $300K annual charity impact.'",
    ],
    bestInClass: "Y Combinator advises: 'State exactly what you need, what you'll do with it, and what milestone it gets you to.'",
  },
  {
    id: "why_now",
    name: "Why Now?",
    icon: "⏰",
    score: 8,
    maxScore: 10,
    verdict: "Strong — promote it!",
    analysis:
      "This is actually one of your strongest sections. Dating app fatigue, AI transparency crisis, Valentine's Day timing — these are specific, urgent, and real. 75% of decks reviewed by VCs don't include a 'Why Now' at all. You have a great one; it just needs to move earlier in the deck to create urgency from the start.",
    fixes: [
      "Move 'Why Now' to slide 2 or 3 — right after the hook. Create urgency before the solution.",
      "Add a concrete stat: '60% of Tinder users report frustration with fake profiles (cite source).'",
      "Tie April 4 launch to the timing: 'We launch in X days. This is the moment.'",
    ],
    bestInClass: "Best decks treat 'Why Now' as the permission structure for everything that follows.",
  },
  {
    id: "storytelling",
    name: "Narrative & Flow",
    icon: "📖",
    score: 4,
    maxScore: 10,
    verdict: "Document, not a story",
    analysis:
      "This reads like a comprehensive business plan, not a pitch deck. That's the core issue. It has ALL the right information but in the wrong format. Investors process: Hook → Problem → Solution → Market → Traction → Team → Ask. Your deck currently reads: Summary → Products → Values → Revenue → Market → Competition → Tech Stack → Financials → GTM → Charity → Funding → Risks → Roadmap → Why Now → Close. That's 15+ sections where you need 10.",
    fixes: [
      "Restructure to 10 slides: Cover → Problem → Solution → Why Now → Market → Traction → Business Model → Team → Ask → Vision.",
      "Each slide = ONE headline point of view. Not 'Platform Overview' but 'Dating apps are broken. We fixed it.'",
      "Move Tech Stack, full financials, risk mitigation, and detailed roadmap to an APPENDIX.",
    ],
    bestInClass: "The 'Hearts → Minds → Wallets' framework: Make them care, then understand, then invest.",
  },
];

const OVERALL_SCORE = CATEGORIES.reduce((a, c) => a + c.score, 0);
const MAX_TOTAL = CATEGORIES.reduce((a, c) => a + c.maxScore, 0);
const PERCENTAGE = Math.round((OVERALL_SCORE / MAX_TOTAL) * 100);

function ScoreBar({ score, max }) {
  const pct = (score / max) * 100;
  const color = pct >= 70 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
      <div style={{ flex: 1, height: 8, background: "#1a1a2e", borderRadius: 4, overflow: "hidden" }}>
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: `linear-gradient(90deg, ${color}88, ${color})`,
            borderRadius: 4,
            transition: "width 0.6s ease",
          }}
        />
      </div>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color, fontWeight: 700, minWidth: 40, textAlign: "right" }}>
        {score}/{max}
      </span>
    </div>
  );
}

function OverallGauge() {
  const radius = 70;
  const stroke = 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (PERCENTAGE / 100) * circumference;
  const color = PERCENTAGE >= 70 ? "#22c55e" : PERCENTAGE >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <svg width={180} height={180} viewBox="0 0 180 180">
        <circle cx="90" cy="90" r={radius} fill="none" stroke="#1a1a2e" strokeWidth={stroke} />
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 90 90)"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
        <text x="90" y="82" textAnchor="middle" style={{ fontSize: 36, fontWeight: 800, fill: "#e2e8f0", fontFamily: "'JetBrains Mono', monospace" }}>
          {PERCENTAGE}%
        </text>
        <text x="90" y="106" textAnchor="middle" style={{ fontSize: 12, fill: "#94a3b8", fontFamily: "'DM Sans', sans-serif" }}>
          {OVERALL_SCORE} / {MAX_TOTAL} pts
        </text>
      </svg>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#f59e0b", letterSpacing: 1, textTransform: "uppercase" }}>Good Foundation</div>
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Strong mission, needs pitch structure</div>
      </div>
    </div>
  );
}

function PriorityMatrix() {
  const sorted = [...CATEGORIES].sort((a, b) => a.score - b.score);
  const critical = sorted.filter((c) => c.score <= 4);
  const improve = sorted.filter((c) => c.score === 5 || c.score === 6);
  const strong = sorted.filter((c) => c.score >= 7);

  const Tag = ({ cat, color }) => (
    <span
      style={{
        display: "inline-block",
        padding: "4px 10px",
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 600,
        background: `${color}18`,
        color: color,
        border: `1px solid ${color}33`,
        marginRight: 6,
        marginBottom: 6,
      }}
    >
      {cat.icon} {cat.name}
    </span>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {critical.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>
            🚨 Fix First
          </div>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {critical.map((c) => <Tag key={c.id} cat={c} color="#ef4444" />)}
          </div>
        </div>
      )}
      {improve.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>
            ⚡ Quick Wins
          </div>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {improve.map((c) => <Tag key={c.id} cat={c} color="#f59e0b" />)}
          </div>
        </div>
      )}
      {strong.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#22c55e", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>
            ✅ Strengths
          </div>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {strong.map((c) => <Tag key={c.id} cat={c} color="#22c55e" />)}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PitchAnalysis() {
  const [expanded, setExpanded] = useState(null);
  const [tab, setTab] = useState("scorecard");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(145deg, #0a0a1a 0%, #0f1029 50%, #0a0a1a 100%)",
        color: "#e2e8f0",
        fontFamily: "'DM Sans', sans-serif",
        padding: "24px 16px",
      }}
    >
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700;800&display=swap" rel="stylesheet" />

      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>
          Pitch Deck Intelligence
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
          FOR THE KIDS
          <span style={{ display: "block", fontSize: 16, fontWeight: 500, color: "#94a3b8", marginTop: 4 }}>
            Investor Pitch Analysis
          </span>
        </h1>
      </div>

      <div
        style={{
          background: "linear-gradient(135deg, #12122a, #1a1a3a)",
          border: "1px solid #ffffff10",
          borderRadius: 16,
          padding: 24,
          marginBottom: 24,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
        }}
      >
        <OverallGauge />
        <PriorityMatrix />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[
          { id: "scorecard", label: "Scorecard" },
          { id: "rewrite", label: "Rewrite Plan" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1,
              padding: "10px 16px",
              borderRadius: 10,
              border: tab === t.id ? "1px solid #f59e0b55" : "1px solid #ffffff10",
              background: tab === t.id ? "#f59e0b15" : "#12122a",
              color: tab === t.id ? "#f59e0b" : "#64748b",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "scorecard" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {CATEGORIES.map((cat) => {
            const isOpen = expanded === cat.id;
            const pct = (cat.score / cat.maxScore) * 100;
            const accentColor = pct >= 70 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#ef4444";

            return (
              <div
                key={cat.id}
                style={{
                  background: isOpen ? "linear-gradient(135deg, #12122a, #1a1a3a)" : "#12122a",
                  border: isOpen ? `1px solid ${accentColor}33` : "1px solid #ffffff08",
                  borderRadius: 14,
                  overflow: "hidden",
                  transition: "all 0.3s",
                }}
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : cat.id)}
                  style={{
                    width: "100%",
                    padding: "16px 18px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    textAlign: "left",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 20 }}>{cat.icon}</span>
                      <span style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0" }}>{cat.name}</span>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: 20,
                        background: `${accentColor}18`,
                        color: accentColor,
                        border: `1px solid ${accentColor}33`,
                      }}
                    >
                      {cat.verdict}
                    </span>
                  </div>
                  <ScoreBar score={cat.score} max={cat.maxScore} />
                </button>

                {isOpen && (
                  <div style={{ padding: "0 18px 18px", display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ borderTop: "1px solid #ffffff08", paddingTop: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>
                        Analysis
                      </div>
                      <p style={{ fontSize: 13, lineHeight: 1.7, color: "#cbd5e1", margin: 0 }}>{cat.analysis}</p>
                    </div>

                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 }}>
                        How to Fix It
                      </div>
                      {cat.fixes.map((fix, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            gap: 10,
                            marginBottom: 8,
                            padding: "10px 12px",
                            background: "#f59e0b08",
                            borderRadius: 8,
                            border: "1px solid #f59e0b15",
                          }}
                        >
                          <span style={{ fontSize: 12, fontWeight: 800, color: "#f59e0b", fontFamily: "'JetBrains Mono', monospace", minWidth: 20 }}>
                            {i + 1}.
                          </span>
                          <span style={{ fontSize: 13, lineHeight: 1.6, color: "#e2e8f0" }}>{fix}</span>
                        </div>
                      ))}
                    </div>

                    <div
                      style={{
                        padding: "12px 14px",
                        background: "#22c55e08",
                        borderRadius: 8,
                        border: "1px solid #22c55e15",
                      }}
                    >
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#22c55e", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>
                        Best-in-Class Example
                      </div>
                      <p style={{ fontSize: 12, lineHeight: 1.6, color: "#94a3b8", margin: 0, fontStyle: "italic" }}>{cat.bestInClass}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === "rewrite" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              background: "linear-gradient(135deg, #12122a, #1a1a3a)",
              border: "1px solid #f59e0b33",
              borderRadius: 14,
              padding: 20,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>
              Recommended 10-Slide Structure
            </div>
            <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7, margin: "0 0 16px" }}>
              Your current deck has 15+ sections. The best-funded startups use 10 slides max. Here's your rewrite roadmap:
            </p>

            {[
              { num: "01", title: "Cover", sub: "One-liner + screenshot", tip: "'An electrician + AI built the most honest dating app on Earth — and every AI tool dollar goes to kids in need.'" },
              { num: "02", title: "Problem", sub: "The pain you solve", tip: "83% of dating app users frustrated with fakes. Billions in charity lost to opacity. Two broken systems, one fix." },
              { num: "03", title: "Why Now", sub: "Timing is everything", tip: "Dating fatigue at all-time high. AI transparency demanded. April 4, 2026 = cultural moment." },
              { num: "04", title: "Solution", sub: "Your product in one visual", tip: "One diagram: Dating App → Revenue → AI Tools → 100% to Kids (DAO-locked). Three products, one flow." },
              { num: "05", title: "Market", sub: "TAM → SAM → SOM", tip: "$5.6B dating → $200M authentic niche → $2M Year 1 SOM. Bottom-up, credible, exciting." },
              { num: "06", title: "Traction", sub: "Proof you can execute", tip: "$30K+ self-funded. 3 live products. Stripe approved. Revenue generating. Systems automated." },
              { num: "07", title: "Business Model", sub: "How money flows", tip: "Pricing tiers visual + the 60/30/10 split. Simple. 'Dating pays bills. AI tools fund kids. Forever.'" },
              { num: "08", title: "Team", sub: "Why you win", tip: "Electrician-to-founder story + AI leverage = 1 person operating a 5-person stack. Add advisors/planned hires." },
              { num: "09", title: "The Ask", sub: "Specific, confident", tip: "'$100K → 5,000 users in 6 months → $25K MRR → $150K annual charity impact.' One number, one plan." },
              { num: "10", title: "Vision", sub: "The 50-year mission", tip: "'No child in medical need. Ever.' End with the mission. Leave them thinking about impact, not spreadsheets." },
            ].map((slide, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 14,
                  padding: "14px 0",
                  borderTop: i > 0 ? "1px solid #ffffff06" : "none",
                }}
              >
                <div
                  style={{
                    minWidth: 40,
                    height: 40,
                    borderRadius: 10,
                    background: "linear-gradient(135deg, #f59e0b22, #f59e0b08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 800,
                    fontSize: 14,
                    color: "#f59e0b",
                    border: "1px solid #f59e0b22",
                  }}
                >
                  {slide.num}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>{slide.title}</span>
                    <span style={{ fontSize: 11, color: "#64748b" }}>{slide.sub}</span>
                  </div>
                  <p style={{ fontSize: 12, lineHeight: 1.6, color: "#94a3b8", margin: 0 }}>{slide.tip}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: "#12122a", border: "1px solid #22c55e22", borderRadius: 14, padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#22c55e", textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>
              Move to Appendix
            </div>
            <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7, margin: 0 }}>
              These sections have great detail but belong in a backup appendix for follow-up meetings, not the main pitch:
              Full tech stack breakdown, detailed financial projections by quarter, risk mitigation matrix, complete 12-month roadmap, compliance and security details, full product portfolio with pricing, customer acquisition phase details, and charity impact metrics.
            </p>
          </div>

          <div style={{ background: "linear-gradient(135deg, #1a1025, #12122a)", border: "1px solid #a855f733", borderRadius: 14, padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#a855f7", textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>
              Your Secret Weapon
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.8, color: "#e2e8f0", margin: 0, fontWeight: 500 }}>
              Most founders pitch technology. You pitch <em>mission</em>. The electrician-to-founder story, the DAO-locked charity commitment, the 50-year vision — this is rare and memorable.
              The fix isn't adding more content. It's cutting ruthlessly and letting the mission breathe. When an investor leaves the room, you want them to remember one thing:
            </p>
            <div
              style={{
                marginTop: 14,
                padding: "14px 18px",
                background: "#a855f710",
                borderRadius: 10,
                borderLeft: "3px solid #a855f7",
                fontSize: 16,
                fontWeight: 700,
                fontStyle: "italic",
                color: "#e2e8f0",
                lineHeight: 1.5,
              }}
            >
              "That electrician built a dating app and locked 100% of his AI revenue for kids. Forever."
            </div>
          </div>
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: 32, padding: "16px 0", borderTop: "1px solid #ffffff08" }}>
        <span style={{ fontSize: 11, color: "#475569" }}>
          Analysis by Claude × Trash Or Treasure Online Recycler LLC
        </span>
      </div>
    </div>
  );
}
