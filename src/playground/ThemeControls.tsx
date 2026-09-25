"use client";
import { useSyncExternalStore } from "react";
import { Button } from "@/ui/Button/Button";
import styles from "./shell.module.css";

const brands = ["cobalt", "sunset", "olive", "bp-legacy"] as const;

// The <html> attributes are the source of truth. An inline script in the root layout sets them before hydration.
function subscribe(cb: () => void) {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-brand"] });
  return () => mo.disconnect();
}
// Light unless dark was chosen: the playground starts in light mode.
const getTheme = () => (document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");
const getBrand = () => document.documentElement.getAttribute("data-brand") ?? "cobalt";

function persist(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch {}
}

export function ThemeControls() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "light");
  const brand = useSyncExternalStore(subscribe, getBrand, () => "cobalt");

  const setTheme = (t: "dark" | "light") => { document.documentElement.setAttribute("data-theme", t); persist("theme", t); };
  const setBrand = (b: string) => {
    if (b === "cobalt") document.documentElement.removeAttribute("data-brand");
    else document.documentElement.setAttribute("data-brand", b);
    persist("brand", b);
  };

  return (
    <>
      <select className={styles.select} aria-label="Brand" value={brand} onChange={(e) => setBrand(e.target.value)}>
        {brands.map((b) => <option key={b} value={b}>{b}</option>)}
      </select>
      <Button emphasis="minimal" size="sm" iconOnly iconStart={theme === "dark" ? "light_mode" : "dark_mode"} onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
        Switch to {theme === "dark" ? "light" : "dark"} mode
      </Button>
    </>
  );
}
