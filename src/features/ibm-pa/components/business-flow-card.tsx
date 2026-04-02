import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { BusinessFlowDefinition } from "@/features/ibm-pa/lib/business-flows";
import { cn } from "@/shared/lib/utils";

type BusinessFlowCardProps = {
  flow: BusinessFlowDefinition;
  href: string;
  isActive?: boolean | undefined;
  recommendation?: {
    note: string;
  } | undefined;
};

const BusinessFlowCard = ({
  flow,
  href,
  isActive,
  recommendation,
}: BusinessFlowCardProps): ReactNode => {
  return (
    <Card
      className={cn(
        "border-slate-200/80 bg-white/90",
        isActive ? "border-emerald-300 ring-2 ring-emerald-100" : "",
      )}
    >
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {flow.semanticTags.map((tag) => (
            <span
              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600"
              key={tag}
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="space-y-2">
          <CardTitle className="text-xl">{flow.title}</CardTitle>
          <CardDescription className="leading-6">
            {flow.description}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm text-slate-600">
          <p>Recommended row focus: {flow.recommendedRowDimensionNames.join(", ")}</p>
          <p>Suggested business context: {flow.semanticTags.join(" / ")}</p>
          {recommendation ? (
            <p className="rounded-[1rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900">
              {recommendation.note}
            </p>
          ) : null}
        </div>

        <Button asChild className="w-full">
          <Link href={href}>
            {isActive ? "Continue this flow" : "Open guided flow"}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export { BusinessFlowCard };
