"use client";
import { createContext, useContext } from "react";

export type FieldLabelPosition = "top" | "start";
export type FieldColumns = 1 | 2 | 3;

// Form shares its layout with the kit fields inside it. RecordPage and FormPage share theirs with the Sections
// and the Form in their details, so the page sets the columns (and the record its labels) once. Modal and Drawer
// clear it, so a dialog opened from a record starts from the kit's own defaults.
export const FormLayoutContext = createContext<{ labelPosition?: FieldLabelPosition; columns?: FieldColumns }>({});

// A field's own labelPosition wins, then the enclosing Form's (or record's), then top.
export function useLabelPosition(own?: FieldLabelPosition): FieldLabelPosition {
  const form = useContext(FormLayoutContext);
  return own ?? form.labelPosition ?? "top";
}

// A Form's or Section's own columns win, then the page's. Unset everywhere, there are no columns: the content
// fills its box, as in a Modal or Drawer.
export function useColumns(own?: FieldColumns): FieldColumns | undefined {
  const form = useContext(FormLayoutContext);
  return own ?? form.columns;
}
