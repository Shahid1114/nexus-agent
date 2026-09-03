"use client";

import { useMemo, useState } from "react";
import { marked } from "marked";

marked.setOptions({ gfm: true, breaks: true });

export interface DeliverableData {
  id: number;
  type: string;
  title: string;
  content: string;
  meta?: Record<string, unknown> | null;
}

function useMarkdown(content: string): string {
  return useMemo(() => marked.parse(content) as string, [content]);
}

function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          /* ignore */
        }
      }}
      className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-violet-500 hover:text-white"
    >
      {done ? "✓ Copied" : "Copy"}
    </button>
  );
}

function MarkdownBlock({ content }: { content: string }) {
  const html = useMarkdown(content);
  return (
    <div
      className="prose-agent max-w-none text-sm"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function EmailBlock({ content }: { content: string }) {
  return (
    <pre className="whitespace-pre-wrap break-words rounded-xl border border-slate-800 bg-[#0b1220] p-4 font-sans text-sm leading-relaxed text-slate-300">
      {content}
    </pre>
  );
}

function ListBlock({ content }: { content: string }) {
  const items = content.split("\n").filter((x) => x.trim());
  return (
    <ul className="space-y-2">
      {items.map((it, i) => (
        <li
          key={i}
          className="flex items-start gap-2 rounded-lg border border-slate-800 bg-[#0b1220] px-3 py-2 text-sm text-slate-300"
        >
          <span className="mt-0.5 text-violet-400">▸</span>
          <span>{it.replace(/^\d+[.)]\s*/, "").replace(/^[-•]\s*/, "")}</span>
        </li>
      ))}
    </ul>
  );
}

function HtmlBlock({ content }: { content: string }) {
  const [tab, setTab] = useState<"preview" | "code">("preview");
  return (
    <div>
      <div className="mb-3 flex gap-2">
        <button
          onClick={() => setTab("preview")}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
            tab === "preview"
              ? "bg-violet-600 text-white"
              : "border border-slate-700 text-slate-400 hover:text-white"
          }`}
        >
          🖥 Live Preview
        </button>
        <button
          onClick={() => setTab("code")}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
            tab === "code"
              ? "bg-violet-600 text-white"
              : "border border-slate-700 text-slate-400 hover:text-white"
          }`}
        >
          {"</>"} Code
        </button>
        <a
          href={`data:text/html;charset=utf-8,${encodeURIComponent(content)}`}
          download="website.html"
          className="ml-auto rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-emerald-500 hover:text-white"
        >
          ↓ Download HTML
        </a>
      </div>
      {tab === "preview" ? (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-white">
          <iframe
            srcDoc={content}
            title="Website preview"
            className="h-[520px] w-full"
            sandbox="allow-scripts"
          />
        </div>
      ) : (
        <pre className="max-h-[520px] overflow-auto rounded-xl border border-slate-800 bg-[#0b1220] p-4 text-xs leading-relaxed text-slate-400">
          <code>{content}</code>
        </pre>
      )}
    </div>
  );
}

function VideoBlock({ content }: { content: string }) {
  const [nonce, setNonce] = useState(0);
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <button
          onClick={() => setNonce((n) => n + 1)}
          className="rounded-lg bg-gradient-to-r from-pink-600 to-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-110"
        >
          ↻ Replay
        </button>
        <a
          href={`data:text/html;charset=utf-8,${encodeURIComponent(content)}`}
          download="video.html"
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-emerald-500 hover:text-white"
        >
          ↓ Download
        </a>
        <span className="ml-auto self-center text-[11px] text-slate-500">
          Plays automatically ▶
        </span>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-black">
        <iframe
          key={nonce}
          srcDoc={content}
          title="Generated video"
          className="aspect-video w-full"
          sandbox="allow-scripts"
        />
      </div>
    </div>
  );
}

export default function DeliverableCard({
  d,
  index,
}: {
  d: DeliverableData;
  index: number;
}) {
  return (
    <div
      className="anim-up rounded-2xl border border-slate-800 bg-[#0d1424]/80 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.35)]"
      style={{ animationDelay: `${index * 90}ms` }}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-white">{d.title}</h3>
        <CopyBtn text={d.content} />
      </div>
      {d.type === "email" && <EmailBlock content={d.content} />}
      {d.type === "list" && <ListBlock content={d.content} />}
      {d.type === "html" && <HtmlBlock content={d.content} />}
      {d.type === "video" && <VideoBlock content={d.content} />}
      {(d.type === "markdown" || d.type === "code") && (
        <MarkdownBlock content={d.content} />
      )}
    </div>
  );
}
