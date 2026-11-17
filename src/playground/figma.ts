import type { Contract } from "./Master";

/** The Figma file the component artboards live in, and the node the contract points at. */
export interface FigmaRef {
  fileKey: string;
  nodeId: string;
}

/**
 * The Figma design URL for a contract, or null when the contract has no figma field.
 * Figma takes the node id with a dash, not the colon the API uses: 81:22 goes in as 81-22.
 */
export function figmaUrl(contract: Pick<Contract, "figma">): string | null {
  const ref = contract.figma;
  if (!ref?.fileKey || !ref?.nodeId) return null;
  return `https://www.figma.com/design/${ref.fileKey}/Agentic-DS?node-id=${ref.nodeId.replace(/:/g, "-")}`;
}
