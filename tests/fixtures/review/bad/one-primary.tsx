// Bad on purpose: the review has to find bp/one-primary here.
import { Button } from "@/ui/Button/Button";

export function OnePrimaryScreen() {
  return (
    <div>
      <Button emphasis="strong" intent="brand">Save</Button>
      {/* BAD: bp/one-primary */}
      <Button emphasis="strong" intent="brand">Send</Button>
    </div>
  );
}
