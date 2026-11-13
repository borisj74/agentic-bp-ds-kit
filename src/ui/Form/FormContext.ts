"use client";
import { createContext, useContext } from "react";

export type FieldLabelPosition = "top" | "start";
export type FieldLabelWidth = "sm" | "md" | "lg";
export type FieldColumns = 1 | 2 | 3;

// Form shares its layout with the kit fields inside it. RecordPage and FormPage share theirs with the Sections
// and the Form in their details, so the page sets the columns (and the record its labels) once. Modal and Drawer
// clear it, so a dialog opened from a record starts from the kit's own defaults.
//
// loading travels the same way: a booting page says so once here, and every Section, field and row under it draws
// its own skeleton in its own place, so the page keeps the shape it will have. Read it with useFieldSkeleton
// (src/ui/LoadingLine/boot.ts), never straight off the context: the hook puts the piece in step with the frame's
// boot sequence, so the skeletons all appear and leave together.
export const FormLayoutContext = createContext<{ labelPosition?: FieldLabelPosition; columns?: FieldColumns; loading?: boolean }>({});

// A field's own labelPosition wins, then the enclosing Form's (or record's), then top.
export function useLabelPosition(own?: FieldLabelPosition): FieldLabelPosition {
  const form = useContext(FormLayoutContext);
  return own ?? form.labelPosition ?? "top";
}

// A field in a Form already stands on the Form's column: the Form sets --input-label-width, which the field reads.
// So labelWidth is not inherited through this context — it names the step this one field departs on, and md, the
// kit's 234, needs no class at all. A field's own step moves its own column, not the controls lined up beside it.
export function labelWidthClass(own?: FieldLabelWidth): "widthSm" | "widthLg" | undefined {
  if (own === undefined || own === "md") return undefined;
  return own === "sm" ? "widthSm" : "widthLg";
}

// A Form's or Section's own columns win, then the page's. Unset everywhere, there are no columns: the content
// fills its box, as in a Modal or Drawer.
export function useColumns(own?: FieldColumns): FieldColumns | undefined {
  const form = useContext(FormLayoutContext);
  return own ?? form.columns;
}
