"use client";
import type { ReactNode } from "react";
import { useDensitySize } from "../Density/Density";
import type { ButtonSize } from "../Button/Button";
import { ButtonGroupContext } from "./context";
import styles from "./ButtonGroup.module.css";

export interface ButtonGroupProps {
  size?: ButtonSize;
  disabled?: boolean;
  label?: string;
  children: ReactNode;
}

export function ButtonGroup({ size: ownSize, disabled = false, label, children }: ButtonGroupProps) {
  const size = useDensitySize(ownSize);
  return (
    <ButtonGroupContext.Provider value={{ size, disabled }}>
      <div className={styles.group} role="group" aria-label={label}>
        {children}
      </div>
    </ButtonGroupContext.Provider>
  );
}
