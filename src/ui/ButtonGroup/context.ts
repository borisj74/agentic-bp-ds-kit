"use client";
import { createContext } from "react";
import type { ButtonSize } from "../Button/Button";

// Set by ButtonGroup so every Button inside shares one size and disabled state.
export const ButtonGroupContext = createContext<{ size: ButtonSize; disabled: boolean } | null>(null);
