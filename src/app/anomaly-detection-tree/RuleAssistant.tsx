"use client";
import { useEffect, useRef, useState } from "react";
import { ChatWindow } from "@/patterns/ChatWindow/ChatWindow";
import { ChatComposer } from "@/ui/ChatComposer/ChatComposer";
import { ChatMessage, type ChatMessageSection } from "@/ui/ChatMessage/ChatMessage";
import type { Result } from "../anomaly-detection/data";
import type { RecordType } from "../anomaly-detection-nodes/graph";
import { draftRule, intentOf, resultsAnswer, startersFor, type Draft, type Starter } from "./assistant";
import type { Stage } from "./tree";

// BP AI beside the tree. It proposes and explains; every change it makes lands on the canvas, where Undo takes it back.

const THINKING = 900;
const PERSON = { name: "Sayra Bunch" };

interface Turn {
  id: string; author: "user" | "assistant"; text?: string; status?: string;
  sections?: ChatMessageSection[]; suggestions?: Starter[]; apply?: { label: string; run: () => void }; done?: boolean;
}

export interface RuleAssistantProps {
  stage: Stage; choosing: boolean; empty: boolean; type: RecordType;
  summary: string[]; next: { label: string; why: string } | null; missing: string | null;
  result: Result; sample: number; flagged: number;
  onDraft: (draft: Draft) => void; onAddNext: () => void; onFewerValues: () => void; onClose: () => void;
}

export function RuleAssistant(props: RuleAssistantProps) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [noticeOpen, setNoticeOpen] = useState(true);
  const count = useRef(0);
  // Answers come after a pause, so they read what the rule is by then, not what it was when asked.
  const live = useRef(props);
  useEffect(() => { live.current = props; });
  const fresh = () => `t${++count.current}`;
  const poor = props.result.kind === "poor";

  // Doing what an answer offers closes that offer, then says what changed.
  const applied = (id: string, follow: Omit<Turn, "id" | "author">) => {
    setTurns((all) => [...all.map((t) => (t.id === id ? { ...t, done: true } : t)), { ...follow, id: fresh(), author: "assistant" }]);
  };

  const answer = (intent: string, text: string, id: string): Omit<Turn, "id" | "author"> => {
    const p = live.current;
    if (intent === "draft") {
      const draft = draftRule(text);
      return {
        text: `Here's a rule for that: ${draft.rule.name}. It has ${draft.steps} steps, from what it checks to what happens on a flag.`,
        sections: [{ id: "assumed", label: "What I assumed", count: draft.assumed.length, defaultOpen: true, content: <ul>{draft.assumed.map((a) => <li key={a}>{a}</li>)}</ul> }],
        apply: {
          label: "Put it on the canvas",
          run: () => {
            live.current.onDraft(draft);
            applied(id, {
              text: "It's on the canvas. Press any card to change it, or Undo at the top to take it all back. Nothing is checked until you train it and turn it on.",
              suggestions: [{ id: "explain", label: "Explain this rule in plain words" }, { id: "next", label: "Is anything missing?" }],
            });
          },
        },
      };
    }
    if (intent === "next") {
      if (p.choosing) return { text: "First pick what the rule checks, or tell me in a sentence and I'll draft the whole rule." };
      if (p.next) {
        return {
          text: `Next it needs ${p.next.label}. ${p.next.why}`,
          apply: { label: `Add ${p.next.label}`, run: () => { live.current.onAddNext(); applied(id, { text: `Added ${p.next!.label}. It's selected on the canvas, so you can set it up there.`, suggestions: [{ id: "next", label: "What should I add next?" }] }); } },
        };
      }
      if (p.missing) return { text: `One thing to fix before training: ${p.missing}` };
      return { text: "Nothing is missing. Press Train model when you're ready: it learns from past records first, and nothing happens to them." };
    }
    if (intent === "explain") return { text: p.summary.length ? p.summary.join(" ") : "This rule doesn't check anything yet." };
    if (intent === "results") {
      if (p.stage !== "results") return { text: "There are no results yet. They show after training, usually 10 to 15 minutes." };
      const r = resultsAnswer(p.result, p.sample, p.flagged, p.type);
      return {
        text: r.text,
        sections: [{ id: "why", label: "Why", defaultOpen: true, content: r.why }],
        apply: p.result.kind === "poor"
          ? { label: "Watch fewer values", run: () => { live.current.onFewerValues(); applied(id, { text: "Done: the rule is back in editing and watches its first 2 values. Train it again to see the new score." }); } }
          : undefined,
        suggestions: p.result.kind === "poor" ? undefined : [{ id: "fewer", label: "How do I get fewer false flags?" }, { id: "apply", label: "What happens if I apply it?" }],
      };
    }
    if (intent === "fewer") return { text: `Narrow it with a Condition, like monthly ${p.type.many} only, or watch fewer values. Then train it again and compare the score.` };
    if (intent === "apply") return { text: `It runs over all past ${p.type.many} once, so you see real counts on the tree. None of them change. When you turn on detection, only ${p.type.newOnes} are checked.` };
    if (intent === "waiting") return { text: `The model is learning what normal looks like from past ${p.type.many}. Nothing happens to them, and you can leave this page; it keeps going.` };
    return { text: "In this concept I can draft a rule from one sentence, say what a rule still needs, and explain its results.", suggestions: startersFor(p.stage, p.choosing, p.empty, poor) };
  };

  const send = (text: string, picked?: string) => {
    const intent = picked && !picked.startsWith("draft") ? picked : intentOf(text, live.current.choosing, live.current.empty);
    const id = fresh();
    setTurns((all) => [...all, { id: fresh(), author: "user", text }, { id, author: "assistant", status: intent === "draft" ? "Drafting your rule" : "Reading this rule" }]);
    setTimeout(() => {
      const reply = answer(intent, text, id);
      setTurns((all) => all.map((t) => (t.id === id ? { id, author: "assistant", ...reply } : t)));
    }, THINKING);
  };

  return (
    <ChatWindow
      title="BP AI" size="panel" autoFocus onClose={props.onClose} onNewChat={() => setTurns([])}
      starters={startersFor(props.stage, props.choosing, props.empty, poor)} onStarter={(id, label) => send(label, id)}
      notice={noticeOpen ? "BP AI can make mistakes. Check important details." : undefined} onNoticeDismiss={() => setNoticeOpen(false)}
      composer={<ChatComposer placeholder={props.choosing || props.empty ? "Describe the rule in a sentence" : "Ask about this rule"} scopeLabel="This rule" defaultScoped onSend={(v) => send(v)} />}
    >
      {turns.length ? turns.map((t) => (
        <ChatMessage
          key={t.id} author={t.author} text={t.text} status={t.status} person={t.author === "user" ? PERSON : undefined}
          sections={t.sections} actions={t.author === "assistant" ? ["copy", "up", "down"] : undefined}
          apply={t.apply && !t.done ? { label: t.apply.label, onApply: t.apply.run } : undefined}
          suggestions={t.done ? undefined : t.suggestions} onSuggestion={(sid, label) => send(label, sid)}
        />
      )) : null}
    </ChatWindow>
  );
}
