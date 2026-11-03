"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, X } from "lucide-react";
import { seedState, STORAGE_KEY, type DemoState } from "@/lib/demo";

type Context = {
  state: DemoState;
  ready: boolean;
  update: (fn: (state: DemoState) => DemoState) => void;
  notify: (message: string) => void;
  reset: () => void;
};
const DemoContext = createContext<Context | null>(null);
export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(seedState);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed.version === 1 &&
          Array.isArray(parsed.campaigns) &&
          Array.isArray(parsed.donations) &&
          parsed.masters &&
          parsed.receipts &&
          parsed.drafts
        )
          setState(parsed);
      }
    } catch {
      setNotice(
        "Saved demo data could not be loaded. Starting with sample data.",
      );
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        setNotice(
          "Browser storage is full or unavailable. Recent changes will only last for this session.",
        );
      }
    }
  }, [state, ready]);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const notify = (message: string) => {
    setNotice(message);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setNotice(""), 5000);
  };
  return (
    <DemoContext.Provider
      value={{
        state,
        ready,
        update: (fn) => setState(fn),
        notify,
        reset: () => {
          setState(seedState());
          notify("Demo data has been reset.");
        },
      }}
    >
      {children}
      {notice && (
        <div
          role="status"
          className="fixed bottom-5 left-4 right-4 z-[100] mx-auto flex max-w-md items-start gap-3 rounded-xl border bg-white p-4 text-sm shadow-xl"
        >
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
          <span className="flex-1">{notice}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => setNotice("")}
          >
            <X className="size-4" />
          </button>
        </div>
      )}
    </DemoContext.Provider>
  );
}
export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) throw new Error("Demo provider is missing");
  return context;
}
