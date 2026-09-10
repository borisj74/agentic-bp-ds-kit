"use client";
import { createContext, useContext } from "react";

export type FieldLabelPosition = "top" | "start";

// Form shares its layout with the kit fields inside it.
export const FormLayoutContext = createContext<{ labelPosition?: FieldLabelPosition }>({});

// A field's own labelPosition wins, then the enclosing Form's, then top.
export function useLabelPosition(own?: FieldLabelPosition): FieldLabelPosition {
  const form = useContext(FormLayoutContext);
  return own ?? form.labelPosition ?? "top";
}
