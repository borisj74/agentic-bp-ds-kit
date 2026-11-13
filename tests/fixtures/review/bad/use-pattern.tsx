// Bad on purpose: the review has to find bp/use-pattern here. This is a ListPage built by hand.
import { Callout } from "@/ui/Callout/Callout";
import { EmptyState } from "@/ui/EmptyState/EmptyState";
import { Pagination } from "@/ui/Pagination/Pagination";
import { Table } from "@/ui/Table/Table";
import { Toolbar } from "@/ui/Toolbar/Toolbar";

export function UsePatternScreen() {
  return (
    <div>
      {/* BAD: bp/use-pattern */}
      <Toolbar label="Invoices" />
      <Table columns={[]} rows={[]} />
      <Pagination label="Invoice pages" total={0} page={1} pageSize={25} />
      <EmptyState title="No invoices" />
      <Callout intent="info" title="Nine invoices are overdue" />
    </div>
  );
}
