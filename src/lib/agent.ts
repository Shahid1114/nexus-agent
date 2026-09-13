import {
  AgentResult,
  Category,
  GeneratedDeliverable,
  PlanStep,
} from "./agent-types";

/* ------------------------------------------------------------------ */
/*  Text helpers                                                        */
/* ------------------------------------------------------------------ */

function titleCase(s: string): string {
  return s
    .split(/\s+/)
    .map((w) => (w.length > 2 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function firstSentence(s: string): string {
  const m = s.match(/[^.!?]+[.!?]?/);
  return (m ? m[0] : s).trim();
}

// Pull the meaningful "topic" out of an instruction.
function extractTopic(prompt: string): string {
  let t = prompt.trim();
  const strip = [
    /^(please|can you|could you|hey|hi|i want you to|i need you to|help me|kindly)\b[\s,]*/i,
    /^(make|create|build|write|draft|generate|do|produce|design|plan|prepare|reply to|respond to|answer)\b\s*/i,
    /^(a|an|the|me|my|some)\b\s*/i,
    /^(email|website|site|video|youtube|script|article|blog|post|content|research|report)\b\s*(about|on|for|regarding|re:)?\s*/i,
    /^(about|on|for|regarding|re:)\b\s*/i,
  ];
  let changed = true;
  while (changed) {
    changed = false;
    for (const re of strip) {
      const next = t.replace(re, "");
      if (next !== t) {
        t = next.trim();
        changed = true;
      }
    }
  }
  return t.length ? t : prompt.trim();
}

/* ------------------------------------------------------------------ */
/*  Category detection                                                 */
/* ------------------------------------------------------------------ */

const KEYWORDS: Record<Exclude<Category, "general">, RegExp[]> = {
  animation: [
    /animation/i,
    /animate/i,
    /animated/i,
    /motion graphic/i,
    /cartoon/i,
    /\bgif\b/i,
    /video to animation/i,
    /explainer animation/i,
  ],
  video: [
    /generate (a )?video/i,
    /make (a )?video/i,
    /create (a )?video/i,
    /video generator/i,
    /promo video/i,
    /intro video/i,
    /ad video/i,
    /trailer/i,
    /reel/i,
    /\bvideo\b/i,
  ],
  youtube: [/youtube/i, /vlog/i, /channel/i, /thumbnail/i, /shorts?/i],
  email: [
    /\bemail\b/i,
    /\breply\b/i,
    /\brespond\b/i,
    /\bfollow[- ]?up\b/i,
    /\bcold outreach\b/i,
    /\binbox\b/i,
    /\bmessage back\b/i,
  ],
  website: [
    /website/i,
    /landing page/i,
    /\bweb ?site\b/i,
    /\bhomepage\b/i,
    /\bweb page\b/i,
    /\bportfolio site\b/i,
  ],
  social: [
    /instagram/i,
    /\btwitter\b/i,
    /\bx post\b/i,
    /linkedin/i,
    /tiktok/i,
    /\bthread\b/i,
    /\bcaption\b/i,
    /social media/i,
    /\bpost\b/i,
    /facebook/i,
  ],
  research: [
    /research/i,
    /\banaly[sz]e\b/i,
    /\bcompare\b/i,
    /\bmarket\b/i,
    /\bcompetitor/i,
    /\bbrief\b/i,
    /\bsummari[sz]e\b/i,
    /\breport\b/i,
    /\bpros and cons\b/i,
  ],
  content: [
    /article/i,
    /blog/i,
    /\bessay\b/i,
    /\bcopy(writing)?\b/i,
    /\bnewsletter\b/i,
    /\bwrite\b/i,
    /\bstory\b/i,
  ],
};

export function detectCategory(prompt: string): Category {
  // High-priority explicit intents.
  if (/video\s*(to|into|→|->)\s*animation/i.test(prompt)) return "animation";
  if (/\byoutube\b/i.test(prompt)) return "youtube";

  const scores: Record<string, number> = {};
  (Object.keys(KEYWORDS) as (keyof typeof KEYWORDS)[]).forEach((cat) => {
    scores[cat] = KEYWORDS[cat].reduce(
      (n, re) => n + (re.test(prompt) ? 1 : 0),
      0,
    );
  });
  let best: Category = "general";
  let bestScore = 0;
  for (const [cat, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      best = cat as Category;
    }
  }
  return best;
}

/* ------------------------------------------------------------------ */
/*  Generators                                                         */
/* ------------------------------------------------------------------ */

function genYouTube(topic: string): {
  steps: PlanStep[];
  deliverables: GeneratedDeliverable[];
  summary: string;
} {
  const t = topic || "your channel";
  const T = titleCase(t);
  const titles = [
    `I Tried ${T} For 30 Days — Here's What Happened`,
    `The Truth About ${T} Nobody Tells You`,
    `${T}: A Complete Beginner's Guide (2026)`,
    `5 ${T} Mistakes That Are Costing You`,
    `How I Mastered ${T} Faster Than Everyone Else`,
  ];
  const tags = [
    t,
    `${t} tutorial`,
    `${t} 2026`,
    `${t} for beginners`,
    `how to ${t}`,
    `${t} tips`,
    `${t} guide`,
    `learn ${t}`,
  ];

  const script = `# Video Script — "${titles[0]}"

## 🎬 Hook (0:00 – 0:15)
"What if I told you that everything you know about ${t} is only half the story? Stick around, because in the next few minutes I'm going to show you exactly what actually works."

## 📌 Intro (0:15 – 0:45)
- Quick self-intro + channel promise
- Tease the 3 big takeaways
- "If this helps you, hit subscribe — it genuinely helps the channel grow."

## 1️⃣ Section One — The Foundation (0:45 – 3:00)
- Explain the core concept of ${t} in plain language
- Show a real example on screen (B-roll)
- Common misconception → the reality

## 2️⃣ Section Two — The Method (3:00 – 6:00)
- Step-by-step walkthrough
- On-screen text for each step
- Highlight the one thing most people skip

## 3️⃣ Section Three — Leveling Up (6:00 – 8:30)
- Advanced tip that separates pros from beginners
- Quick case study / result
- Call out a tool or resource

## 🎯 Recap + CTA (8:30 – 9:30)
- Recap the 3 takeaways
- "Comment your biggest challenge with ${t} below"
- Point to the next video (end screen)

## 🔚 Outro (9:30 – 10:00)
- Thank viewers, remind to subscribe, roll end card.`;

  const description = `🔥 In this video we break down ${t} step by step — no fluff, just what works.

⏱️ TIMESTAMPS
00:00 Intro
00:45 The Foundation
03:00 The Method
06:00 Leveling Up
08:30 Recap & Key Takeaways

👉 Subscribe for weekly videos on ${t}: [YOUR CHANNEL LINK]
📩 Business inquiries: your@email.com

#${t.replace(/\s+/g, "")} #${t.replace(/\s+/g, "")}2026 #tutorial`;

  const uploadPlan = `## 📅 30-Day Upload & Growth Plan for "${T}"

| Week | Video | Format | Goal |
|------|-------|--------|------|
| 1 | ${titles[2]} | Long-form (10m) | Establish authority |
| 1 | 60-sec teaser | Shorts | Feed the algorithm |
| 2 | ${titles[3]} | Long-form (8m) | Drive watch time |
| 2 | Behind the scenes | Shorts | Build connection |
| 3 | ${titles[0]} | Long-form (12m) | Retention + shares |
| 3 | Quick tip | Shorts | Reach new viewers |
| 4 | ${titles[4]} | Long-form (10m) | Convert to subs |

**Publishing cadence:** 2 uploads/week (1 long-form Tues, 1 Short Fri) at 4 PM local.
**Thumbnail rule:** big expressive face + 3–4 words max + high contrast.
**First 24h:** reply to every comment, pin a question, share to community tab.`;

  return {
    summary: `Produced a full YouTube content kit for "${T}": 5 optimized titles, a complete 10-minute script, an SEO description, tags, and a 30-day upload plan.`,
    steps: [
      { title: "Analyze the topic & audience", detail: `Identified niche angle and search intent around "${t}".` },
      { title: "Brainstorm high-CTR titles", detail: "Generated 5 title variants using proven hook formulas." },
      { title: "Write the full video script", detail: "Structured hook → sections → CTA with timestamps." },
      { title: "Optimize description & tags", detail: "SEO-friendly description with timestamps and hashtag set." },
      { title: "Build a 30-day upload calendar", detail: "Cadence, formats and growth actions mapped out." },
    ],
    deliverables: [
      {
        type: "list",
        title: "🎯 5 High-CTR Title Options",
        content: titles.map((x, i) => `${i + 1}. ${x}`).join("\n"),
      },
      { type: "markdown", title: "📝 Full Video Script", content: script },
      { type: "markdown", title: "📄 Video Description (SEO)", content: description },
      {
        type: "list",
        title: "🏷️ Suggested Tags",
        content: tags.join("\n"),
      },
      { type: "markdown", title: "📅 30-Day Upload Plan", content: uploadPlan },
    ],
  };
}

function genEmail(prompt: string, topic: string): {
  steps: PlanStep[];
  deliverables: GeneratedDeliverable[];
  summary: string;
} {
  const subj = titleCase(topic || "your message");
  const isReply = /\b(reply|respond|answer|follow[- ]?up|back)\b/i.test(prompt);
  const tone = /\bcasual|friendly|warm\b/i.test(prompt) ? "warm" : "professional";

  const reply = `Subject: Re: ${subj}

Hi [Name],

Thank you for reaching out — I appreciate you taking the time to write.

To your point about ${topic || "this"}, here's where things stand: I've reviewed the details and I'm glad to move forward. Below is a quick summary so we're aligned:

• What I can confirm: [key point / agreement]
• What I'll need from you: [any info or action]
• Next step: [proposed action + timing]

If a quick call would be easier, I'm free ${"[day]"} between ${"[time range]"}. Otherwise, just reply here and I'll take it from there.

Looking forward to it, and thanks again for your patience.

Best regards,
[Your Name]
[Title · Company · Phone]`;

  const followUp = `Subject: Following up on ${subj}

Hi [Name],

Just a gentle nudge on my last note about ${topic || "this"} — I know inboxes get busy!

Whenever you have a moment, I'd love to hear your thoughts so we can keep things moving. Happy to jump on a short call if that's simpler.

No rush at all — thanks so much.

Best,
[Your Name]`;

  return {
    summary: `Drafted a ${tone} ${isReply ? "reply" : "email"} about "${subj}" plus a ready-to-send follow-up. Just fill the [brackets] and hit send.`,
    steps: [
      { title: "Understand the intent", detail: `Determined this needs a ${tone} ${isReply ? "reply" : "outreach email"}.` },
      { title: "Draft the main message", detail: "Wrote a clear, structured email with a call to action." },
      { title: "Prepare a follow-up", detail: "Created a polite nudge in case there's no response." },
      { title: "Add fill-in placeholders", detail: "Marked personalizable fields with [brackets]." },
    ],
    deliverables: [
      { type: "email", title: `✉️ Main Email — ${subj}`, content: reply },
      { type: "email", title: "✉️ Follow-up (send after 3 days)", content: followUp },
      {
        type: "list",
        title: "✅ Before You Send — Checklist",
        content: [
          "Replace all [bracketed] placeholders",
          "Confirm the recipient's name spelling",
          "Attach any promised files",
          "Double-check the subject line",
          "Read once out loud for tone",
        ].join("\n"),
      },
    ],
  };
}

function genWebsite(topic: string): {
  steps: PlanStep[];
  deliverables: GeneratedDeliverable[];
  summary: string;
} {
  const brand = titleCase(topic || "Your Brand");
  const slug = (topic || "brand").split(/\s+/)[0];
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${brand}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box;font-family:'Segoe UI',system-ui,sans-serif}
  body{color:#0f172a;background:#fff;line-height:1.6}
  .nav{display:flex;justify-content:space-between;align-items:center;padding:20px 8%;position:sticky;top:0;background:rgba(255,255,255,.85);backdrop-filter:blur(10px);z-index:10}
  .logo{font-weight:800;font-size:22px;background:linear-gradient(90deg,#8b5cf6,#4d7cff);-webkit-background-clip:text;background-clip:text;color:transparent}
  .nav a{margin-left:26px;text-decoration:none;color:#334155;font-weight:500}
  .btn{background:linear-gradient(90deg,#8b5cf6,#4d7cff);color:#fff!important;padding:11px 22px;border-radius:10px;font-weight:600}
  .hero{text-align:center;padding:110px 8% 90px;background:radial-gradient(1200px 500px at 50% -10%,#ede9fe,#fff)}
  .hero h1{font-size:clamp(34px,6vw,64px);font-weight:800;letter-spacing:-1px;max-width:900px;margin:0 auto}
  .hero p{font-size:20px;color:#475569;margin:22px auto 34px;max-width:620px}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:24px;padding:70px 8%}
  .card{border:1px solid #e2e8f0;border-radius:18px;padding:30px;transition:.2s}
  .card:hover{transform:translateY(-6px);box-shadow:0 20px 40px rgba(15,23,42,.08)}
  .card .ico{width:52px;height:52px;border-radius:12px;display:grid;place-items:center;font-size:26px;background:#f1f5f9;margin-bottom:18px}
  .card h3{font-size:20px;margin-bottom:8px}
  .card p{color:#64748b}
  .cta{margin:40px 8% 90px;text-align:center;background:linear-gradient(120deg,#8b5cf6,#4d7cff);border-radius:26px;padding:70px 30px;color:#fff}
  .cta h2{font-size:34px;margin-bottom:14px}
  .cta .btn{background:#fff;color:#4d7cff!important;margin-top:22px;display:inline-block}
  footer{text-align:center;padding:40px;color:#94a3b8;font-size:14px}
</style>
</head>
<body>
  <nav class="nav">
    <div class="logo">${brand}</div>
    <div>
      <a href="#features">Features</a>
      <a href="#pricing">Pricing</a>
      <a href="#cta" class="btn">Get Started</a>
    </div>
  </nav>

  <header class="hero">
    <h1>${brand} makes ${slug} effortless</h1>
    <p>The modern platform built to help you do more, faster. Beautiful, powerful, and ready when you are.</p>
    <a href="#cta" class="btn">Start free today →</a>
  </header>

  <section class="grid" id="features">
    <div class="card"><div class="ico">⚡</div><h3>Lightning Fast</h3><p>Built for speed so you never wait around. Everything just works.</p></div>
    <div class="card"><div class="ico">🎯</div><h3>Made For You</h3><p>Designed around real needs with a clean, intuitive experience.</p></div>
    <div class="card"><div class="ico">🔒</div><h3>Secure by Default</h3><p>Your data is protected with best-in-class security, always.</p></div>
    <div class="card"><div class="ico">💬</div><h3>Loved by Users</h3><p>Rated 4.9/5 by thousands of happy customers worldwide.</p></div>
  </section>

  <section class="cta" id="cta">
    <h2>Ready to get started?</h2>
    <p>Join thousands already using ${brand}. No credit card required.</p>
    <a href="#" class="btn">Create your account</a>
  </section>

  <footer>© 2026 ${brand}. Built by Nexus Agent.</footer>
</body>
</html>`;

  return {
    summary: `Built a complete, responsive one-page website for "${brand}" — hero, feature grid, CTA and footer. Preview it live and download the HTML.`,
    steps: [
      { title: "Define brand & structure", detail: `Chose sections and a modern layout for "${brand}".` },
      { title: "Design the visual system", detail: "Gradient palette, typography, hover states, responsive grid." },
      { title: "Write the copy", detail: "Hero headline, feature blurbs and a conversion CTA." },
      { title: "Assemble the page", detail: "Produced self-contained, deployable HTML+CSS." },
    ],
    deliverables: [
      {
        type: "html",
        title: `❖ ${brand} — Live Website`,
        content: html,
        meta: { preview: true },
      },
    ],
  };
}

function genContent(topic: string): {
  steps: PlanStep[];
  deliverables: GeneratedDeliverable[];
  summary: string;
} {
  const T = titleCase(topic || "Your Topic");
  const article = `# ${T}: The Complete Guide

*Estimated read: 6 minutes*

## Introduction
${T} has quickly become something everyone seems to be talking about — and for good reason. Whether you're just getting started or looking to sharpen what you already know, understanding it well can genuinely change how you work. In this guide we'll cut through the noise and give you a clear, practical roadmap.

## Why ${T} Matters
It's easy to dismiss ${topic || "this"} as another passing trend, but the fundamentals tell a different story. The people and businesses that lean in early tend to build a lasting advantage: they move faster, waste less, and make better decisions. In short, getting this right compounds over time.

## The Core Principles
1. **Start with the fundamentals.** Master the basics before chasing shortcuts — they're what everything else is built on.
2. **Focus on consistency, not intensity.** Small, repeated actions beat rare bursts of effort every time.
3. **Measure what matters.** Track a few meaningful signals instead of drowning in vanity metrics.
4. **Iterate relentlessly.** Treat every attempt as data, adjust, and go again.

## A Practical, Step-by-Step Approach
- **Step 1 — Set a clear goal.** Define what success actually looks like for you.
- **Step 2 — Build your system.** Put simple routines and tools in place so progress doesn't rely on willpower.
- **Step 3 — Execute and observe.** Take action, then watch what happens without judgment.
- **Step 4 — Refine.** Double down on what works and quietly drop what doesn't.

## Common Mistakes to Avoid
- Trying to do everything at once instead of picking one priority.
- Copying others without understanding *why* something works.
- Giving up right before momentum kicks in.

## Conclusion
${T} isn't about secret tricks — it's about clarity, consistency, and a willingness to improve. Start small, stay steady, and you'll be surprised how far you get. The best time to begin was yesterday; the second best time is right now.

---
*Want a shorter version, a different tone, or an SEO-tuned edition? Just ask the agent.*`;

  return {
    summary: `Wrote a complete, publish-ready article on "${T}" (~800 words) with intro, structured sections, actionable steps, and a conclusion.`,
    steps: [
      { title: "Research the angle", detail: `Framed "${topic}" for maximum reader value.` },
      { title: "Outline the structure", detail: "Intro → why it matters → principles → steps → mistakes → conclusion." },
      { title: "Write the full draft", detail: "Engaging, scannable long-form copy." },
      { title: "Polish & format", detail: "Added headings, lists and a call to action." },
    ],
    deliverables: [
      { type: "markdown", title: `✎ Article — ${T}`, content: article },
    ],
  };
}

function genSocial(topic: string): {
  steps: PlanStep[];
  deliverables: GeneratedDeliverable[];
  summary: string;
} {
  const t = topic || "your topic";
  const T = titleCase(t);

  const twitter = `🧵 Everything you need to know about ${t} (a thread):

1/ Most people overcomplicate ${t}. It's simpler than it looks — you just need the right starting point.

2/ The #1 mistake? Trying to master everything at once. Pick ONE thing and go deep.

3/ Here's the framework I use:
→ Learn the fundamentals
→ Practice daily (even 15 min)
→ Track your progress
→ Adjust and repeat

4/ The secret nobody tells you: consistency beats talent. Show up when you don't feel like it.

5/ If you found this useful, follow for more on ${t}. Repost the first tweet to help someone else 🙏`;

  const linkedin = `I used to think ${t} was only for experts.

I was wrong.

After spending real time with it, here's what I learned:

→ The barrier to entry is lower than you think
→ Small consistent effort compounds fast
→ The best time to start was yesterday — the second best is today

If you've been putting off ${t}, this is your sign.

What's stopping you from starting? 👇

#${t.replace(/\s+/g, "")} #growth #learning`;

  const instagram = `✨ ${T} made simple ✨

Save this post so you don't forget 📌

Swipe to learn the 3 things that actually move the needle 👉

Which one are you working on? Drop a 🔥 in the comments!

.
.
#${t.replace(/\s+/g, "")} #${t.replace(/\s+/g, "")}tips #motivation #dailygrowth`;

  return {
    summary: `Created a cross-platform social pack for "${T}": an X/Twitter thread, a LinkedIn post, and an Instagram caption — all ready to post.`,
    steps: [
      { title: "Adapt the message per platform", detail: "Matched tone and format to each network." },
      { title: "Write the Twitter/X thread", detail: "5-tweet thread with a strong hook and CTA." },
      { title: "Write the LinkedIn post", detail: "Story-driven post optimized for engagement." },
      { title: "Write the Instagram caption", detail: "Caption with hooks, CTA and hashtags." },
    ],
    deliverables: [
      { type: "markdown", title: "🐦 X / Twitter Thread", content: twitter },
      { type: "markdown", title: "💼 LinkedIn Post", content: linkedin },
      { type: "markdown", title: "📸 Instagram Caption", content: instagram },
    ],
  };
}

function genResearch(topic: string): {
  steps: PlanStep[];
  deliverables: GeneratedDeliverable[];
  summary: string;
} {
  const T = titleCase(topic || "Your Topic");
  const brief = `# Research Brief: ${T}

## Executive Summary
This brief provides a structured overview of ${topic || "the subject"}, covering the current landscape, key considerations, opportunities, and recommended next steps. Use it as a decision-ready starting point.

## Key Findings
- **Landscape:** ${T} sits within a fast-moving space with growing interest and clear practical use-cases.
- **Drivers:** Adoption is pushed by efficiency gains, cost pressure, and rising expectations.
- **Barriers:** The main friction points are knowledge gaps, upfront effort, and change management.

## Opportunities
1. Early movers can capture outsized value before the space matures.
2. Combining ${topic || "this"} with existing workflows multiplies returns.
3. Underserved segments remain wide open for a focused approach.

## Risks & Considerations
- Moving too fast without a plan can lead to wasted effort.
- Over-reliance on trends instead of fundamentals.
- Underestimating the time to see compounding results.

## Recommended Next Steps
1. Define a single, measurable objective.
2. Run a small, low-risk pilot to gather real data.
3. Review results in 2–4 weeks and scale what works.

## Open Questions
- What resources/budget are realistically available?
- Who owns execution and accountability?
- What does success look like in 90 days?`;

  const comparison = `## Quick Comparison Framework

| Criteria | Option A | Option B | Option C |
|----------|----------|----------|----------|
| Cost | $ | $$ | $$$ |
| Ease of start | High | Medium | Low |
| Long-term payoff | Medium | High | High |
| Risk | Low | Medium | Medium |
| Best for | Beginners | Growth | Scale |

**Recommendation:** Start with the lowest-risk option to learn quickly, then reinvest gains into the higher-payoff path.`;

  return {
    summary: `Delivered a decision-ready research brief on "${T}" with findings, opportunities, risks, next steps and a comparison framework.`,
    steps: [
      { title: "Scope the question", detail: `Framed the research objective for "${topic}".` },
      { title: "Gather & structure insights", detail: "Organized findings into a clear brief." },
      { title: "Assess opportunities & risks", detail: "Balanced upside against considerations." },
      { title: "Recommend next steps", detail: "Provided an actionable path and comparison table." },
    ],
    deliverables: [
      { type: "markdown", title: `⌕ Research Brief — ${T}`, content: brief },
      { type: "markdown", title: "📊 Comparison Framework", content: comparison },
    ],
  };
}

interface Scene {
  kicker: string;
  headline: string;
  sub?: string;
}

// Builds a self-contained, autoplaying motion-graphics "video" (HTML/CSS/JS).
function buildMotionVideo(
  brand: string,
  scenes: Scene[],
  opts: { c1: string; c2: string; style: "video" | "animation" },
): string {
  const perScene = 3200; // ms
  const total = scenes.length * perScene;
  const sceneHtml = scenes
    .map(
      (s, i) => `
      <div class="scene" data-i="${i}">
        <div class="kicker">${s.kicker}</div>
        <div class="headline">${s.headline}</div>
        ${s.sub ? `<div class="sub">${s.sub}</div>` : ""}
      </div>`,
    )
    .join("");

  const shapes =
    opts.style === "animation"
      ? `<div class="shape s1"></div><div class="shape s2"></div><div class="shape s3"></div><div class="shape s4"></div>`
      : `<div class="shape s1"></div><div class="shape s2"></div>`;

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${brand} — Video</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box;font-family:'Segoe UI',system-ui,sans-serif}
  html,body{height:100%;overflow:hidden;background:#05070f}
  .stage{position:relative;width:100%;height:100vh;display:grid;place-items:center;
    background:linear-gradient(125deg,${opts.c1},${opts.c2});overflow:hidden}
  .stage::after{content:"";position:absolute;inset:0;background:radial-gradient(1000px 500px at 50% 120%,rgba(255,255,255,.18),transparent);pointer-events:none}
  .shape{position:absolute;border-radius:50%;filter:blur(6px);opacity:.5;mix-blend-mode:screen}
  .s1{width:340px;height:340px;background:#fff3;top:-80px;left:-60px;animation:float1 9s ease-in-out infinite}
  .s2{width:260px;height:260px;background:#ffffff2e;bottom:-70px;right:-40px;animation:float2 11s ease-in-out infinite}
  .s3{width:180px;height:180px;background:#ffffff33;top:30%;right:12%;animation:float1 7s ease-in-out infinite}
  .s4{width:120px;height:120px;background:#ffffff2a;bottom:20%;left:14%;animation:float2 8s ease-in-out infinite}
  @keyframes float1{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(40px,30px) scale(1.15)}}
  @keyframes float2{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-40px,-30px) scale(1.1)}}
  .scenes{position:relative;z-index:2;width:88%;max-width:820px;text-align:center;color:#fff}
  .scene{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:100%;opacity:0}
  .scene.active{animation:scenePlay ${perScene}ms ease forwards}
  @keyframes scenePlay{
    0%{opacity:0;transform:translate(-50%,-42%) scale(.96)}
    12%{opacity:1;transform:translate(-50%,-50%) scale(1)}
    82%{opacity:1;transform:translate(-50%,-50%) scale(1)}
    100%{opacity:0;transform:translate(-50%,-58%) scale(1.02)}
  }
  .kicker{font-size:14px;letter-spacing:3px;text-transform:uppercase;opacity:.85;font-weight:600;margin-bottom:14px}
  .headline{font-size:clamp(30px,6vw,58px);font-weight:800;line-height:1.08;letter-spacing:-1px;text-shadow:0 6px 30px rgba(0,0,0,.25)}
  .sub{margin-top:16px;font-size:clamp(15px,2.4vw,21px);opacity:.9;font-weight:500}
  .bar{position:absolute;left:0;bottom:0;height:5px;width:0;z-index:5;
    background:linear-gradient(90deg,#fff,rgba(255,255,255,.6));animation:prog ${total}ms linear forwards}
  @keyframes prog{to{width:100%}}
  .badge{position:absolute;top:18px;left:18px;z-index:5;font-size:12px;font-weight:700;color:#fff;
    background:rgba(0,0,0,.28);padding:6px 12px;border-radius:99px;backdrop-filter:blur(6px);display:flex;gap:6px;align-items:center}
  .dot{width:8px;height:8px;border-radius:50%;background:#ff5b5b;animation:blink 1.1s infinite}
  @keyframes blink{50%{opacity:.25}}
  .replay{position:absolute;inset:0;z-index:8;display:none;place-items:center;background:rgba(5,7,15,.55);backdrop-filter:blur(3px)}
  .replay.show{display:grid}
  .replay button{background:#fff;color:#111;border:0;padding:14px 26px;border-radius:99px;font-weight:700;font-size:15px;cursor:pointer;box-shadow:0 10px 30px rgba(0,0,0,.3)}
</style></head>
<body>
  <div class="stage" id="stage">
    ${shapes}
    <div class="badge"><span class="dot"></span>${opts.style === "animation" ? "ANIMATION" : "VIDEO"} · ${Math.round(total / 1000)}s</div>
    <div class="scenes" id="scenes">${sceneHtml}</div>
    <div class="bar" id="bar"></div>
    <div class="replay" id="replay"><button onclick="play()">▶ Replay</button></div>
  </div>
<script>
  var scenes=[].slice.call(document.querySelectorAll('.scene'));
  var per=${perScene}, timers=[];
  function play(){
    timers.forEach(clearTimeout); timers=[];
    document.getElementById('replay').classList.remove('show');
    var bar=document.getElementById('bar');
    bar.style.animation='none'; void bar.offsetWidth; bar.style.animation='';
    scenes.forEach(function(s){s.classList.remove('active');s.style.opacity=0;});
    scenes.forEach(function(s,i){
      timers.push(setTimeout(function(){
        scenes.forEach(function(x){x.classList.remove('active')});
        s.classList.add('active');
      }, i*per));
    });
    timers.push(setTimeout(function(){
      document.getElementById('replay').classList.add('show');
    }, scenes.length*per));
  }
  play();
</script>
</body></html>`;
}

function genVideo(topic: string): {
  steps: PlanStep[];
  deliverables: GeneratedDeliverable[];
  summary: string;
} {
  const t = topic || "your idea";
  const T = titleCase(t);
  const scenes: Scene[] = [
    { kicker: "Introducing", headline: T, sub: "A story worth watching." },
    { kicker: "The problem", headline: `Doing ${t} the old way is hard`, sub: "Slow, messy, and frustrating." },
    { kicker: "The solution", headline: `Meet a smarter way`, sub: `${T}, reimagined for 2026.` },
    { kicker: "Why it works", headline: "Fast · Simple · Powerful", sub: "Everything you need, nothing you don't." },
    { kicker: "Get started", headline: `Try ${T} today`, sub: "→ yourlink.com" },
  ];
  const video = buildMotionVideo(T, scenes, {
    c1: "#7c3aed",
    c2: "#db2777",
    style: "video",
  });

  const script = `# 🎬 Video Script — "${T}"

**Format:** 16s promo / social reel · **Aspect:** 16:9 (also export 9:16 for Reels)

## Scene 1 — Hook (0:00–0:03)
**On screen:** "${T}" title reveal
**Voiceover:** "This is ${t}."

## Scene 2 — Problem (0:03–0:06)
**On screen:** "Doing ${t} the old way is hard"
**Voiceover:** "The old way? Slow, messy, frustrating."

## Scene 3 — Solution (0:06–0:09)
**On screen:** "Meet a smarter way"
**Voiceover:** "So we reimagined it."

## Scene 4 — Benefits (0:09–0:13)
**On screen:** "Fast · Simple · Powerful"
**Voiceover:** "Everything you need. Nothing you don't."

## Scene 5 — CTA (0:13–0:16)
**On screen:** "Try ${T} today"
**Voiceover:** "Get started now."`;

  const shotlist = `## 🎥 Shot List & Production Notes

| # | Duration | Visual | Motion | Audio |
|---|----------|--------|--------|-------|
| 1 | 3s | Title card | Scale-in + blur clear | Whoosh + soft pad |
| 2 | 3s | Problem text | Slide up | Tense beat |
| 3 | 3s | Solution reveal | Cross-fade | Uplifting hit |
| 4 | 4s | 3 benefit words | Staggered pop | Rising synth |
| 5 | 3s | CTA + link | Pulse | Button click SFX |

**Palette:** violet → pink gradient. **Font:** bold geometric sans.
**Music:** upbeat, 120 BPM. **Export:** MP4 1080p + vertical 1080×1920.`;

  return {
    summary: `Generated a playable motion-graphics video for "${T}" — it autoplays in the preview with 5 animated scenes, a progress bar and replay. Plus a full script and shot list.`,
    steps: [
      { title: "Interpret the concept", detail: `Turned "${t}" into a 5-scene video story.` },
      { title: "Storyboard the scenes", detail: "Hook → problem → solution → benefits → CTA." },
      { title: "Design motion & style", detail: "Gradient theme, animated shapes, timed transitions." },
      { title: "Render the animated video", detail: "Produced a self-contained, autoplaying video." },
      { title: "Write script & shot list", detail: "Voiceover and production plan for filming/exporting." },
    ],
    deliverables: [
      {
        type: "video",
        title: `🎬 ${T} — Generated Video (autoplays)`,
        content: video,
        meta: { preview: true },
      },
      { type: "markdown", title: "📝 Video Script", content: script },
      { type: "markdown", title: "🎥 Shot List & Production Notes", content: shotlist },
    ],
  };
}

function genAnimation(topic: string): {
  steps: PlanStep[];
  deliverables: GeneratedDeliverable[];
  summary: string;
} {
  const t = topic || "your concept";
  const T = titleCase(t);
  const scenes: Scene[] = [
    { kicker: "Animation", headline: T, sub: "Bringing your idea to life." },
    { kicker: "Frame by frame", headline: "Smooth motion", sub: "Fluid transitions & easing." },
    { kicker: "Style", headline: "Bold. Colorful. Alive.", sub: "Motion graphics that pop." },
    { kicker: "The end", headline: "That's a wrap ✨", sub: "Loop it. Share it. Love it." },
  ];
  const anim = buildMotionVideo(T, scenes, {
    c1: "#0891b2",
    c2: "#4f46e5",
    style: "animation",
  });

  const spec = `# ✨ Animation Spec — "${T}"

**Type:** Motion-graphics animation · **Loop:** Yes · **FPS target:** 60

## Timeline
| Beat | Time | Animation | Easing |
|------|------|-----------|--------|
| Intro | 0.0–3.2s | Title scales in, background morphs | ease-out |
| Motion | 3.2–6.4s | Floating orbs drift + parallax | ease-in-out |
| Style | 6.4–9.6s | Color words pop with bounce | cubic-bezier |
| Outro | 9.6–12.8s | Wrap card fades, loops back | ease |

## Motion Principles Applied
- **Anticipation** before each text reveal
- **Overlapping action** on background shapes
- **Ease in/out** — nothing moves linearly
- **Secondary motion** — orbs continue drifting during holds

## Export Recommendations
- Lottie/JSON for web (tiny + crisp), or MP4/WebM for social
- Provide 1:1, 16:9 and 9:16 crops
- Keep under 15s for maximum shareability`;

  return {
    summary: `Turned "${T}" into a looping animated motion sequence — it plays live in the preview with drifting shapes, eased transitions and a wrap card. Includes a full animation spec.`,
    steps: [
      { title: "Read the concept", detail: `Planned an animation from "${t}".` },
      { title: "Design keyframes", detail: "Mapped intro → motion → style → outro beats." },
      { title: "Apply motion principles", detail: "Easing, anticipation and secondary motion." },
      { title: "Render the animation", detail: "Produced a looping, playable animated sequence." },
    ],
    deliverables: [
      {
        type: "video",
        title: `✨ ${T} — Animated Sequence (plays live)`,
        content: anim,
        meta: { preview: true },
      },
      { type: "markdown", title: "🎞️ Animation Spec & Timeline", content: spec },
    ],
  };
}

function genGeneral(prompt: string, topic: string): {
  steps: PlanStep[];
  deliverables: GeneratedDeliverable[];
  summary: string;
} {
  const task = firstSentence(prompt);
  const plan = `# Action Plan: ${titleCase(topic || "Your Task")}

**Your request:** ${task}

## How I'd approach this
1. **Clarify the goal** — Define exactly what "done" looks like.
2. **Break it down** — Split the work into small, manageable pieces.
3. **Prioritize** — Tackle the highest-impact piece first.
4. **Execute** — Work through each piece methodically.
5. **Review** — Check the result against the goal and refine.

## Suggested checklist
- [ ] Confirm the desired outcome and deadline
- [ ] Gather anything needed to start (info, access, assets)
- [ ] Do the core work
- [ ] Quality-check the result
- [ ] Deliver and follow up

## Next step
Tell me any specifics (audience, tone, length, platform, deadline) and I'll produce the finished deliverable directly.`;

  return {
    summary: `Analyzed your request and produced a structured action plan with a checklist. Add specifics and I'll generate the finished output.`,
    steps: [
      { title: "Interpret the request", detail: `Parsed: "${task}".` },
      { title: "Design an approach", detail: "Broke the task into clear phases." },
      { title: "Create an actionable plan", detail: "Delivered steps + a checklist to execute." },
    ],
    deliverables: [
      { type: "markdown", title: "✦ Action Plan", content: plan },
    ],
  };
}

/* ------------------------------------------------------------------ */
/*  OpenAI (optional upgrade)                                          */
/* ------------------------------------------------------------------ */

async function tryOpenAI(prompt: string): Promise<AgentResult | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  try {
    const category = detectCategory(prompt);
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              'You are Nexus, an autonomous agent that completes tasks and returns polished deliverables. Respond ONLY with JSON of shape: {"title":string,"summary":string,"steps":[{"title":string,"detail":string}],"deliverables":[{"type":"markdown|email|html|list|code","title":string,"content":string}]}. Produce complete, ready-to-use content in each deliverable.',
          },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
    if (!parsed.deliverables?.length) return null;
    return {
      category,
      title: parsed.title || titleCase(extractTopic(prompt)),
      summary: parsed.summary || "",
      steps: parsed.steps || [],
      deliverables: parsed.deliverables,
    };
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Main entry                                                         */
/* ------------------------------------------------------------------ */

export async function runAgent(prompt: string): Promise<AgentResult> {
  const ai = await tryOpenAI(prompt);
  if (ai) return ai;

  const category = detectCategory(prompt);
  const topic = extractTopic(prompt);

  let gen: {
    steps: PlanStep[];
    deliverables: GeneratedDeliverable[];
    summary: string;
  };

  switch (category) {
    case "youtube":
      gen = genYouTube(topic);
      break;
    case "video":
      gen = genVideo(topic);
      break;
    case "animation":
      gen = genAnimation(topic);
      break;
    case "email":
      gen = genEmail(prompt, topic);
      break;
    case "website":
      gen = genWebsite(topic);
      break;
    case "content":
      gen = genContent(topic);
      break;
    case "social":
      gen = genSocial(topic);
      break;
    case "research":
      gen = genResearch(topic);
      break;
    default:
      gen = genGeneral(prompt, topic);
  }

  const title = titleCase(topic).slice(0, 80) || firstSentence(prompt).slice(0, 80);

  return {
    category,
    title: title || "New Task",
    summary: gen.summary,
    steps: gen.steps,
    deliverables: gen.deliverables,
  };
}
