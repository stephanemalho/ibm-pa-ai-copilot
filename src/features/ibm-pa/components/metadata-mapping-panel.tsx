import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  Tm1MappingEdge,
  Tm1MappingNode,
  Tm1MetadataMappingResponse,
} from "@/shared/types/ibm-pa";

type MetadataMappingPanelProps = {
  data: Tm1MetadataMappingResponse;
};

const MetadataMappingPanel = ({
  data,
}: MetadataMappingPanelProps): ReactNode => {
  const cubes = data.nodes.filter((node) => node.kind === "cube");
  const dimensions = data.nodes.filter((node) => node.kind === "dimension");
  const processes = data.nodes.filter((node) => node.kind === "process");
  const edges = data.edges.slice(0, 120);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="Server" value={data.serverName} />
        <SummaryCard label="Cubes" value={data.summary.cubeCount.toString()} />
        <SummaryCard
          label="Dimensions"
          value={data.summary.dimensionCount.toString()}
        />
        <SummaryCard label="Edges" value={data.summary.edgeCount.toString()} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Metadata relationship map</CardTitle>
            <CardDescription>
              Server, cubes, dimensions, and process mentions discovered from
              IBM Planning Analytics metadata.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <MappingSection
              items={data.nodes.filter((node) => node.kind === "server")}
              title="Server"
            />
            <MappingSection items={cubes} title="Cubes" />
            <MappingSection items={dimensions} title="Dimensions" />
            {data.summary.includesProcesses ? (
              <MappingSection items={processes} title="Processes" />
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Edges</CardTitle>
            <CardDescription>
              Showing up to {edges.length} relationships for quick review.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {edges.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                No edges were generated for the current server.
              </div>
            ) : (
              <div className="space-y-3">
                {edges.map((edge) => (
                  <EdgeRow edge={edge} key={edge.id} nodes={data.nodes} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const MappingSection = ({
  items,
  title,
}: {
  items: Tm1MappingNode[];
  title: string;
}): ReactNode => {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
          {title}
        </h3>
      </div>
      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          No items found.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <div
              className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
              key={item.id}
            >
              <div className="text-sm font-semibold text-slate-900">
                {item.label}
              </div>
              <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                {item.kind}
              </div>
              {item.secondaryLabel ? (
                <div className="mt-2 text-sm text-slate-600">
                  {item.secondaryLabel}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const EdgeRow = ({
  edge,
  nodes,
}: {
  edge: Tm1MappingEdge;
  nodes: Tm1MappingNode[];
}): ReactNode => {
  const source =
    nodes.find((node) => node.id === edge.source)?.label ?? edge.source;
  const target =
    nodes.find((node) => node.id === edge.target)?.label ?? edge.target;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-sm font-semibold text-slate-900">{source}</div>
      <div className="my-1 text-xs uppercase tracking-[0.18em] text-slate-500">
        {edge.label}
      </div>
      <div className="text-sm text-slate-700">{target}</div>
    </div>
  );
};

const SummaryCard = ({
  label,
  value,
}: {
  label: string;
  value: string;
}): ReactNode => {
  return (
    <Card className="border-slate-200/80 bg-white/90">
      <CardHeader className="pb-3">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-lg">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
};

export { MetadataMappingPanel };
