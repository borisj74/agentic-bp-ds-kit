import { CatalogShell } from "@/playground/CatalogShell";

export default function PlaygroundLayout({ children }: { children: React.ReactNode }) {
  return <CatalogShell>{children}</CatalogShell>;
}
