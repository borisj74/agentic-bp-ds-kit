"use client";
import { createContext, useContext, type ReactNode } from "react";
import styles from "./Density.module.css";

export type DensityValue = "compact" | "default" | "comfortable";
export type DensitySize = "sm" | "md" | "lg";

export interface DensityProps {
  value: DensityValue;
  children: ReactNode;
}

const DensityContext = createContext<DensityValue | undefined>(undefined);

// Sets the density tokens for everything inside (data-density): space, control and icon sizes, and font sizes
// follow the Compact / Default / Comfortable values. Controls keep their own size. Nest it to change one area.
export function Density({ value, children }: DensityProps) {
  return (
    <DensityContext.Provider value={value}>
      <div data-density={value} className={styles.root}>{children}</div>
    </DensityContext.Provider>
  );
}

export const useDensity = (): DensityValue => useContext(DensityContext) ?? "default";

// For popups portalled to <body>: put this on the portal root as data-density, so the popup keeps the density
// of the Density it was opened from. Undefined when there is no Density around.
export const usePortalDensity = () => useContext(DensityContext);

// For controls with sm / md / lg: their own size, else md. Density changes the tokens, not the size.
export function useDensitySize(own?: DensitySize): DensitySize {
  return own ?? "md";
}
