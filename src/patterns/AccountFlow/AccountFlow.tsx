"use client";
import { cloneElement, isValidElement, useEffect, useRef, type ReactElement, type ReactNode } from "react";
import { ListPage } from "@/patterns/ListPage/ListPage";
import { FormLayoutContext } from "@/ui/Form/FormContext";
import { LoadingLine } from "@/ui/LoadingLine/LoadingLine";
import { BootContext, useBoot, useBootPhase, type BootTiming } from "@/ui/LoadingLine/boot";
import styles from "./AccountFlow.module.css";

export type AccountFlowView = "list" | "account" | "newAccount" | "newProduct" | "provisionProduct" | "bulkProducts";

export interface AccountFlowProps {
  view: AccountFlowView;
  list: ReactNode;
  account: ReactNode;
  newAccount: ReactNode;
  newProduct: ReactNode;
  provisionProduct?: ReactNode;
  bulkProducts?: ReactNode;
  loading?: boolean;
  loadingLabel?: string;
  bootTiming?: BootTiming;
}

type PageProps = { state?: string; loading?: boolean; header?: ReactNode };

/**
 * Hands the boot to the page that is showing, so that page draws its own skeleton where its content will stand. A
 * ListPage boots through its state; a RecordPage or FormPage through loading, and so does the PageHeader it
 * carries, since that header lives inside the page rather than in the frame's pageHeader slot.
 */
function booting(page: ReactNode): ReactNode {
  if (!isValidElement(page)) return page;
  const el = page as ReactElement<PageProps>;
  if (el.type === ListPage) return cloneElement(el, { state: "loading" });
  const header = el.props.header;
  return cloneElement(el, {
    loading: true,
    ...(isValidElement(header) ? { header: cloneElement(header as ReactElement<{ loading?: boolean }>, { loading: true }) } : {}),
  });
}

// Figma Account Provisioning: the accounts list, one account with its tabs, a new account, a new product on an
// account, then configuring that product on its own or many products at once. A blueprint only: each page is a kit
// pattern the screen builds (ListPage, RecordPage, FormPage), and the screen owns which one is showing. It sits in
// the AppShell page.
export function AccountFlow({
  view, list, account, newAccount, newProduct, provisionProduct, bulkProducts,
  loading = false, loadingLabel = "Loading page", bootTiming,
}: AccountFlowProps) {
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

  // Inside an AppShell the frame keeps the boot sequence and publishes it, so the page follows the frame's clock
  // and the frame draws the line and says once what is loading. Outside one the flow runs the same sequence
  // itself (contracts/loadingline.json: the line alone for 200ms, the skeleton held at least 400ms, the content
  // fading in over 150ms), so a page that lands inside the first 200ms never flashes a skeleton here either.
  const frame = useBoot();
  const own = useBootPhase(loading && !frame, bootTiming);

  const pages: Record<AccountFlowView, ReactNode> = { list, account, newAccount, newProduct, provisionProduct, bulkProducts };
  // The page stays booted for the whole skeleton step, not only while the data is still coming, so the header it
  // carries keeps its bars through the 400ms hold along with everything else on the page.
  const clock = frame ?? own;
  const page = loading || clock.showSkeleton ? booting(pages[view]) : pages[view];

  if (frame) return <div ref={box} className={styles.flow}>{page}</div>;

  return (
    <BootContext.Provider value={own}>
      <div ref={box} className={[styles.flow, styles.alone].join(" ")}>
        {own.showLine && (
          <div className={styles.loadingLine}>
            <LoadingLine track="none" label={loadingLabel} />
          </div>
        )}
        {/* The real page stays in the tree so it keeps its shape and its pieces draw their own bars in place, but
            it is out of reach of the keyboard and of screen readers; the line's label is the one status. */}
        {own.showSkeleton ? (
          <FormLayoutContext.Provider value={{ loading: true }}>
            <div className={styles.booting} inert aria-hidden="true">{page}</div>
          </FormLayoutContext.Provider>
        ) : (
          <div className={[styles.page, own.settling ? styles.settling : ""].join(" ")}>{page}</div>
        )}
      </div>
    </BootContext.Provider>
  );
}
