"use client";
import { useEffect, useRef, type ReactNode } from "react";
import styles from "./AccountFlow.module.css";

export type AccountFlowView = "list" | "account" | "newAccount" | "newProduct";

export interface AccountFlowProps {
  view: AccountFlowView;
  list: ReactNode;
  account: ReactNode;
  newAccount: ReactNode;
  newProduct: ReactNode;
}

// Figma Account Provisioning: the accounts list, one account with its tabs, a new account, and a new product on
// an account. A blueprint only: each page is a kit pattern the screen builds (ListPage, RecordPage, FormPage), and
// the screen owns which one is showing. It sits in the AppShell page.
export function AccountFlow({ view, list, account, newAccount, newProduct }: AccountFlowProps) {
  const box = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  // A new page is announced by moving focus to its title, and the page starts at its top, as a real navigation
  // would. Not on the first page, which the person arrived at themselves.
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const main = box.current?.closest("main");
    if (main) main.scrollTop = 0;
    const title = main?.querySelector<HTMLElement>("h1");
    if (!title) return;
    title.tabIndex = -1;
    title.focus({ preventScroll: true });
  }, [view]);

  const pages: Record<AccountFlowView, ReactNode> = { list, account, newAccount, newProduct };
  return <div ref={box} className={styles.flow}>{pages[view]}</div>;
}
