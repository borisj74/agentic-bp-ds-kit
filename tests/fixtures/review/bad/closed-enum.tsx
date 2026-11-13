// Bad on purpose: the review has to find bp/closed-enum here.
import { Button } from "@/ui/Button/Button";

export function ClosedEnumScreen() {
  {/* BAD: bp/closed-enum */}
  return <Button tone="brand">Save</Button>;
}
