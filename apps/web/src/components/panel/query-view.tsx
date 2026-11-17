"use client";

import type { ReactNode } from "react";
import type { SWRResponse } from "swr";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/surface";
import type { ApiError } from "@/lib/api";
import { PageSkeleton } from "./page-skeleton";

const NOT_FOUND = 404;

export function QueryView<T>({
  query,
  children,
}: {
  query: SWRResponse<T, ApiError>;
  children: (data: T) => ReactNode;
}) {
  if (query.data !== undefined) return children(query.data);
  if (!query.error) return <PageSkeleton />;
  return (
    <Card>
      <EmptyState
        title={query.error.status === NOT_FOUND ? "Nie znaleziono" : "Nie udało się wczytać danych"}
        description={query.error.message}
        action={
          query.error.status === NOT_FOUND ? undefined : (
            <Button variant="secondary" onClick={() => query.mutate()}>
              Spróbuj ponownie
            </Button>
          )
        }
      />
    </Card>
  );
}
