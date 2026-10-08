// 零侵入语言状态：模块级 store + useSyncExternalStore 订阅。
// 不依赖 React Provider——任何组件调用 useLang() 都共享同一份状态，
// 初始值从 localStorage 读取（默认 zh），切换即写回并通知所有订阅者。
import { useCallback, useSyncExternalStore } from "react";
import { dict } from "./dict";
import type { Lang } from "./dict";

export type { Lang } from "./dict";

const STORAGE_KEY = "catswap-lang";

function readStoredLang(): Lang {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "en" ? "en" : "zh";
  } catch {
    return "zh";
  }
}

let current: Lang = typeof window === "undefined" ? "zh" : readStoredLang();
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): Lang {
  return current;
}

function getServerSnapshot(): Lang {
  return "zh";
}

export function setLang(next: Lang): void {
  if (next === current) return;
  current = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // localStorage 不可用时静默降级为仅内存状态
  }
  listeners.forEach((listener) => listener());
}

export function toggleLang(): void {
  setLang(current === "zh" ? "en" : "zh");
}

/** 非响应式翻译（用当前模块级语言）；组件内请优先用 useLang().t。 */
export function t(key: string): string {
  const entry = dict[key];
  if (!entry) return key;
  return entry[current] ?? entry.zh ?? key;
}

export function useLang(): {
  lang: Lang;
  setLang: (next: Lang) => void;
  toggleLang: () => void;
  t: (key: string) => string;
} {
  const lang = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const translate = useCallback(
    (key: string): string => {
      const entry = dict[key];
      if (!entry) return key;
      return entry[lang] ?? entry.zh ?? key;
    },
    [lang],
  );
  return { lang, setLang, toggleLang, t: translate };
}
