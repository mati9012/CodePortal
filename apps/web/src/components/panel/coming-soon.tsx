import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/surface";

/** Ekran zastępczy dla widoków panelu, które jeszcze powstają. */
export function ComingSoon({ title, description, back }: { title: string; description: string; back: { href: string; label: string } }) {
  return (
    <Card className="mt-2">
      <EmptyState
        title={title}
        description={description}
        action={
          <Link href={back.href} className={buttonClasses({ variant: "secondary" })}>
            {back.label}
          </Link>
        }
      />
    </Card>
  );
}
