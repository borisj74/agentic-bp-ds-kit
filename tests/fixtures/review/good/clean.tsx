// Clean on purpose: the review finds nothing here.
import { Button } from "@/ui/Button/Button";
import { Section } from "@/ui/Section/Section";
import { Table } from "@/ui/Table/Table";

export function CleanScreen() {
  return (
    <Section title="Invoices" actions={<Button emphasis="strong" intent="brand">New invoice</Button>}>
      <Table columns={[]} rows={[]} />
    </Section>
  );
}
