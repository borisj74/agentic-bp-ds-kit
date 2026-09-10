"use client";
import { createContext, useContext, type ReactNode } from "react";

export type DensityValue = "compact" | "default" | "comfortable";
export type DensitySize = "sm" | "md" | "lg";

export interface DensityProps {
  value: DensityValue;
  children: ReactNode;
}

const DensityContext = createContext<DensityValue>("default");
const SIZE: Record<DensityValue, DensitySize> = { compact: "sm", default: "md", comfortable: "lg" };

// Sets the default size of the kit controls inside it: compact = sm, default = md, comfortable = lg.
// A control's own size always wins. Nest it to change one area, like a dense table toolbar.
export function Density({ value, children }: DensityProps) {
  return <DensityContext.Provider value={value}>{children}</DensityContext.Provider>;
}

export const useDensity = () => useContext(DensityContext);

// For controls with sm / md / lg: their own size, else the nearest Density's, else md.
export function useDensitySize(own?: DensitySize): DensitySize {
  const density = useContext(DensityContext);
  return own ?? SIZE[density];
}
