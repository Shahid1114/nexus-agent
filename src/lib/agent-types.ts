export type Category =
  | "youtube"
  | "video"
  | "animation"
  | "email"
  | "website"
  | "content"
  | "social"
  | "research"
  | "general";

export type DeliverableType =
  | "markdown"
  | "email"
  | "html"
  | "list"
  | "code"
  | "video";

export interface PlanStep {
  title: string;
  detail: string;
}

export interface GeneratedDeliverable {
  type: DeliverableType;
  title: string;
  content: string;
  meta?: Record<string, unknown>;
}

export interface AgentResult {
  category: Category;
  title: string;
  summary: string;
  steps: PlanStep[];
  deliverables: GeneratedDeliverable[];
}

export const CATEGORY_META: Record<
  Category,
  { label: string; icon: string; color: string; blurb: string }
> = {
  youtube: {
    label: "YouTube Automation",
    icon: "▶",
    color: "#ff4d4d",
    blurb: "Titles, scripts, descriptions, tags & upload plan",
  },
  video: {
    label: "Video Generator",
    icon: "🎬",
    color: "#ec4899",
    blurb: "Generates a playable motion-graphics video + script",
  },
  animation: {
    label: "Video → Animation",
    icon: "✨",
    color: "#22d3ee",
    blurb: "Turns a concept into an animated motion sequence",
  },
  email: {
    label: "Email Assistant",
    icon: "✉",
    color: "#4d7cff",
    blurb: "Drafts professional replies & follow-ups",
  },
  website: {
    label: "Website Builder",
    icon: "❖",
    color: "#8b5cf6",
    blurb: "Generates a live, responsive landing page",
  },
  content: {
    label: "Content Writer",
    icon: "✎",
    color: "#10b981",
    blurb: "Long-form articles, blogs & copywriting",
  },
  social: {
    label: "Social Media",
    icon: "◎",
    color: "#f59e0b",
    blurb: "Posts, threads & captions across platforms",
  },
  research: {
    label: "Research Analyst",
    icon: "⌕",
    color: "#06b6d4",
    blurb: "Structured research, briefs & comparisons",
  },
  general: {
    label: "General Assistant",
    icon: "✦",
    color: "#64748b",
    blurb: "Plans and executes any task step by step",
  },
};
