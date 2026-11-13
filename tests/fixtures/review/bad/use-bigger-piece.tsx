// Bad on purpose: the review has to find bp/use-bigger-piece here. This is a PageHeader built by hand.
import { Badge } from "@/ui/Badge/Badge";
import { Breadcrumb } from "@/ui/Breadcrumb/Breadcrumb";
import { Button } from "@/ui/Button/Button";

export function UseBiggerPieceScreen() {
  return (
    <div>
      {/* BAD: bp/use-bigger-piece */}
      <Breadcrumb items={[{ label: "Home", href: "#" }]} />
      <h1>Invoice INV-10482</h1>
      <Badge intent="danger">Overdue</Badge>
      <Button>Edit</Button>
    </div>
  );
}
