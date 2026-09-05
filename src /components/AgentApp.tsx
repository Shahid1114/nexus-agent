"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CATEGORY_META, Category } from "@/lib/agent-types";
import DeliverableCard, { DeliverableData } from "./DeliverableCard";

interface Task {
  id: number;
  title: string;
  prompt: string;
  category: Category;
  status: string;
  summary: string;
  createdAt: string;
}
interface Step {
  id: number;
  idx: number;
  title: string;
  detail: string;
  status: string;
}
interface Detail {
  task: Task;
  steps: Step[];
  deliverables: DeliverableData[];
}

const EXAMPLES = [
  "Generate a promo video for my new fitness app",
  "Turn my product launch into an animation",
  "Create a YouTube video about learning guitar in 30 days",
  "Reply to a client email about a delayed project delivery",
  "Build a website for my coffee shop 'Bean & Brew'",
  "Write a blog article about productivity for remote workers",
  "Research the pros and cons of electric vs gas cars",
];

const THINKING = [
  "Understanding your request…",
  "Choosing the right skill…",
  "Breaking the work into steps…",
  "Generating your deliverables…",
  "Polishing the output…",
];

function CatBadge({ category }: { category: Category }) {
  const m = CATEGORY_META[category] ?? CATEGORY_META.general;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ background: `${m.color}22`, color: m.color }}
    >
      <span>{m.icon}</span>
      {m.label}
    </span>
  );
}

export default function AgentApp() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [active, setActive] = useState<Detail | null>(null);
  const [input, setInput] = useState("");
  const [working, setWorking] = useState(false);
  const [thinkIdx, setThinkIdx] = useState(0);
  const [stepsDone, setStepsDone] = useState(0);
  const [showDeliverables, setShowDeliverables] = useState(false);
  const [detectedCat, setDetectedCat] = useState<Category | null>(null);
  const [error, setError] = useState("");
  const feedRef = useRef<HTMLDivElement>(null);

  const loadTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      if (data.tasks) setTasks(data.tasks);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Cycle thinking messages while working
  useEffect(() => {
    if (!working) return;
    const t = setInterval(
      () => setThinkIdx((i) => (i + 1) % THINKING.length),
      900,
    );
    return () => clearInterval(t);
  }, [working]);

  const revealSteps = useCallback((detail: Detail) => {
    setStepsDone(0);
    setShowDeliverables(false);
    let i = 0;
    const total = detail.steps.length;
    const tick = () => {
      i += 1;
      setStepsDone(i);
      if (i < total) {
        setTimeout(tick, 420);
      } else {
        setTimeout(() => setShowDeliverables(true), 350);
      }
    };
    if (total > 0) setTimeout(tick, 300);
    else setShowDeliverables(true);
  }, []);

  const submit = useCallback(
    async (prompt: string) => {
      const p = prompt.trim();
      if (!p || working) return;
      setError("");
      setWorking(true);
      setActive(null);
      setShowDeliverables(false);
      setStepsDone(0);
      setThinkIdx(0);
      feedRef.current?.scrollTo({ top: 0 });
      try {
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: p }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Something went wrong");
        const detail: Detail = {
          task: data.task,
          steps: data.steps,
          deliverables: data.deliverables,
        };
        setActive(detail);
        setInput("");
        setWorking(false);
        revealSteps(detail);
        loadTasks();
      } catch (e) {
        setWorking(false);
        setError(e instanceof Error ? e.message : "Failed");
      }
    },
    [working, revealSteps, loadTasks],
  );

  const openTask = useCallback(async (id: number) => {
    setError("");
    setWorking(false);
    try {
      const res = await fetch(`/api/tasks/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const detail: Detail = {
        task: data.task,
        steps: data.steps,
        deliverables: data.deliverables,
      };
      setActive(detail);
      setStepsDone(detail.steps.length);
      setShowDeliverables(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to open task");
    }
  }, []);

  const deleteTask = useCallback(
    async (id: number, e: React.MouseEvent) => {
      e.stopPropagation();
      await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (active?.task.id === id) setActive(null);
      loadTasks();
    },
    [active, loadTasks],
  );

  // Live category detection preview on input
  useEffect(() => {
    if (!input.trim()) {
      setDetectedCat(null);
      return;
    }
    const t = setTimeout(() => {
      // lightweight client-side hint mirroring server keywords
      const p = input.toLowerCase();
      const map: [Category, RegExp][] = [
        ["animation", /animation|animate|animated|motion graphic|cartoon/],
        ["youtube", /youtube|channel|vlog|shorts/],
        ["video", /video|promo|trailer|reel|intro video|ad video/],
        ["email", /email|reply|respond|follow.?up|inbox/],
        ["website", /website|landing page|homepage|web ?site/],
        ["social", /instagram|twitter|linkedin|tiktok|caption|social|post/],
        ["research", /research|analy|compare|market|competitor|report|brief/],
        ["content", /article|blog|essay|copy|newsletter|write|story/],
      ];
      const hit = map.find(([, re]) => re.test(p));
      setDetectedCat(hit ? hit[0] : "general");
    }, 200);
    return () => clearTimeout(t);
  }, [input]);

  const startNew = () => {
    setActive(null);
    setError("");
    setInput("");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#070a13]">
      {/* Sidebar */}
      <aside className="hidden w-72 shrink-0 flex-col border-r border-slate-800/80 bg-[#0a0f1c] md:flex">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 text-lg font-black text-white shadow-lg">
            N
          </div>
          <div>
            <div className="text-sm font-bold text-white">Nexus Agent</div>
            <div className="text-[11px] text-slate-500">Autonomous worker</div>
          </div>
        </div>

        <div className="px-4">
          <button
            onClick={startNew}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:brightness-110"
          >
            <span className="text-lg leading-none">＋</span> New Task
          </button>
        </div>

        <div className="mt-6 px-5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          History
        </div>
        <div className="mt-2 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {tasks.length === 0 && (
            <p className="px-2 py-4 text-xs text-slate-600">
              No tasks yet. Give the agent something to do →
            </p>
          )}
          {tasks.map((t) => {
            const m = CATEGORY_META[t.category] ?? CATEGORY_META.general;
            return (
              <button
                key={t.id}
                onClick={() => openTask(t.id)}
                className={`group flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left transition ${
                  active?.task.id === t.id
                    ? "bg-slate-800/80"
                    : "hover:bg-slate-800/40"
                }`}
              >
                <span
                  className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg text-xs"
                  style={{ background: `${m.color}22`, color: m.color }}
                >
                  {m.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium text-slate-200">
                    {t.title}
                  </span>
                  <span className="block text-[10px] text-slate-500">
                    {m.label}
                  </span>
                </span>
                <span
                  onClick={(e) => deleteTask(t.id, e)}
                  className="hidden shrink-0 rounded p-1 text-slate-600 transition hover:text-red-400 group-hover:block"
                  title="Delete"
                >
                  ✕
                </span>
              </button>
            );
          })}
        </div>

        <div className="border-t border-slate-800/80 px-5 py-3 text-[10px] text-slate-600">
          {process.env.NEXT_PUBLIC_HAS_AI === "1"
            ? "⚡ GPT-powered"
            : "Built-in reasoning engine"}
        </div>
      </aside>

      {/* Main */}
      <main ref={feedRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-10">
          {/* Mobile header */}
          <div className="mb-6 flex items-center justify-between md:hidden">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 font-black text-white">
                N
              </div>
              <span className="font-bold text-white">Nexus</span>
            </div>
            <button
              onClick={startNew}
              className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white"
            >
              ＋ New
            </button>
          </div>

          {/* Empty / start state */}
          {!active && !working && (
            <div className="anim-up">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-xs text-slate-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400 pulse-glow" />
                Agent online & ready
              </div>
              <h1 className="mt-3 text-3xl font-extrabold leading-tight text-white md:text-4xl">
                Tell me what to do.
                <br />
                <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
                  I&apos;ll get it done.
                </span>
              </h1>
              <p className="mt-3 max-w-xl text-sm text-slate-400">
                YouTube automation, email replies, building websites, writing
                content, research — just describe the task and Nexus plans it,
                works through it, and hands you the finished result.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {(Object.keys(CATEGORY_META) as Category[])
                  .filter((c) => c !== "general")
                  .map((c) => {
                    const m = CATEGORY_META[c];
                    return (
                      <div
                        key={c}
                        className="rounded-xl border border-slate-800 bg-[#0c1322] p-3"
                      >
                        <div
                          className="mb-1.5 grid h-8 w-8 place-items-center rounded-lg text-sm"
                          style={{ background: `${m.color}22`, color: m.color }}
                        >
                          {m.icon}
                        </div>
                        <div className="text-xs font-semibold text-slate-200">
                          {m.label}
                        </div>
                        <div className="mt-0.5 text-[11px] leading-snug text-slate-500">
                          {m.blurb}
                        </div>
                      </div>
                    );
                  })}
              </div>

              <div className="mt-7 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Try one of these
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => submit(ex)}
                    className="rounded-full border border-slate-800 bg-slate-900/50 px-3 py-1.5 text-left text-xs text-slate-300 transition hover:border-violet-500 hover:text-white"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Working state */}
          {working && (
            <div className="anim-up">
              <CatBadge category={detectedCat ?? "general"} />
              <h2 className="mt-3 text-xl font-bold text-white">
                Working on it…
              </h2>
              <div className="mt-5 space-y-3">
                {THINKING.map((msg, i) => (
                  <div
                    key={msg}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                      i === thinkIdx
                        ? "border-violet-600/60 bg-violet-600/10 text-white"
                        : i < thinkIdx
                          ? "border-slate-800 bg-slate-900/40 text-slate-500"
                          : "border-slate-800/50 bg-slate-900/20 text-slate-600"
                    }`}
                  >
                    {i < thinkIdx ? (
                      <span className="text-emerald-400">✓</span>
                    ) : i === thinkIdx ? (
                      <span className="inline-block h-4 w-4 rounded-full border-2 border-violet-400 border-t-transparent spin" />
                    ) : (
                      <span className="h-4 w-4 rounded-full border-2 border-slate-700" />
                    )}
                    {msg}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Result state */}
          {active && !working && (
            <div className="anim-up">
              <div className="flex flex-wrap items-center gap-3">
                <CatBadge category={active.task.category} />
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
                  ✓ Completed
                </span>
              </div>
              <h2 className="mt-3 text-2xl font-bold text-white">
                {active.task.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                {active.task.summary}
              </p>

              {/* Plan */}
              <div className="mt-6 rounded-2xl border border-slate-800 bg-[#0b1120] p-5">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <span>⚙</span> Execution Plan
                </div>
                <ol className="space-y-2.5">
                  {active.steps.map((s, i) => {
                    const done = i < stepsDone;
                    const running = i === stepsDone;
                    return (
                      <li
                        key={s.id}
                        className={`flex items-start gap-3 transition-all duration-300 ${
                          done || running
                            ? "opacity-100"
                            : "opacity-40"
                        }`}
                      >
                        <span
                          className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${
                            done
                              ? "bg-emerald-500 text-white"
                              : running
                                ? "border-2 border-violet-400 border-t-transparent spin"
                                : "border border-slate-700 text-slate-500"
                          }`}
                        >
                          {done ? "✓" : running ? "" : i + 1}
                        </span>
                        <div>
                          <div className="text-sm font-medium text-slate-200">
                            {s.title}
                          </div>
                          <div className="text-xs text-slate-500">
                            {s.detail}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>

              {/* Deliverables */}
              {showDeliverables && (
                <div className="mt-7">
                  <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <span>📦</span> Deliverables ({active.deliverables.length})
                  </div>
                  <div className="space-y-4">
                    {active.deliverables.map((d, i) => (
                      <DeliverableCard key={d.id} d={d} index={i} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-xl border border-red-800/60 bg-red-950/40 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="sticky bottom-0 border-t border-slate-800/80 bg-[#070a13]/90 backdrop-blur">
          <div className="mx-auto max-w-3xl px-4 py-4 md:px-8">
            {detectedCat && input.trim() && !working && (
              <div className="mb-2 flex items-center gap-2 text-[11px] text-slate-500">
                Nexus will use:{" "}
                <CatBadge category={detectedCat} />
              </div>
            )}
            <div className="flex items-end gap-2 rounded-2xl border border-slate-700 bg-[#0d1424] p-2 focus-within:border-violet-500">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submit(input);
                  }
                }}
                rows={1}
                placeholder="Describe a task… e.g. 'Reply to my client's email about the invoice'"
                disabled={working}
                className="max-h-40 flex-1 resize-none bg-transparent px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600 disabled:opacity-50"
              />
              <button
                onClick={() => submit(input)}
                disabled={working || !input.trim()}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {working ? (
                  <span className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent spin" />
                ) : (
                  <span className="text-lg">↑</span>
                )}
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] text-slate-600">
              Nexus can make mistakes — review important deliverables before use.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
