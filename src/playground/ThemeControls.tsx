"use client";
import { useSyncExternalStore } from "react";
import { Segmented } from "@/ui/Segmented/Segmented";
import { Select } from "@/ui/Select/Select";
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

/** The brand ramps are what a component is painted with, so the picker rides with the component, not the page. */
export function BrandPicker() {
  const brand = useSyncExternalStore(subscribe, getBrand, () => "cobalt");
  const setBrand = (b: string) => {
    if (b === "cobalt") document.documentElement.removeAttribute("data-brand");
    else document.documentElement.setAttribute("data-brand", b);
    persist("brand", b);
  };
  return (
    <span className={styles.brandPicker}>
      <Select
        label="Brand" hideLabel size="sm" menuWidth="field"
        options={brands.map((b) => ({ value: b, label: b }))}
        value={brand} onChange={(value) => setBrand(value as string)}
      />
    </span>
  );
}

export function ThemeControls() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "light");
  const setTheme = (t: "dark" | "light") => { document.documentElement.setAttribute("data-theme", t); persist("theme", t); };

  return (
    /* Light or dark is a choice between two, so it is the kit Segmented, like the catalog's other
       switchers. The two marks say it on their own, so it runs iconOnly; each label is still the option's name. */
    <Segmented
      label="Colour mode" hideLabel size="sm" iconOnly
      options={[
        { value: "light", label: "Light", icon: "light_mode" },
        { value: "dark", label: "Dark", icon: "dark_mode" },
      ]}
      value={theme} onChange={(value) => setTheme(value as "light" | "dark")}
    />
  );
}
