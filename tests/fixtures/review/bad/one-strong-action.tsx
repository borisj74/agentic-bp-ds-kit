// Bad on purpose: the review has to find bp/one-strong-action here.
import { Button } from "@/ui/Button/Button";
import { Section } from "@/ui/Section/Section";

export function OneStrongActionTile() {
  return (
    <Section
      title="Unapplied cash"
      actions={<Button emphasis="strong" intent="brand">Apply</Button>}
    >
      {/* BAD: bp/one-strong-action */}
      <Button emphasis="strong" intent="danger">Write off</Button>
    </Section>
  );
}
