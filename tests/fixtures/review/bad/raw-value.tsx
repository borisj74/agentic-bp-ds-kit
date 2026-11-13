// Bad on purpose: the review has to find bp/raw-value here.
import { Section } from "@/ui/Section/Section";

export function RawValueScreen() {
  return (
    <Section title="Totals">
      {/* BAD: bp/raw-value */}
      <div style={{ padding: "13px", color: "#1a73e8" }}>Paid</div>
    </Section>
  );
}
