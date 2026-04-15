import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Tm1RecentMessageLogsResponse } from "@/shared/types/ibm-pa";

type RecentLogsPanelProps = {
  data: Tm1RecentMessageLogsResponse;
};

const RecentLogsPanel = ({ data }: RecentLogsPanelProps): ReactNode => {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="Server" value={data.serverName} />
        <SummaryCard
          label="Entries returned"
          value={data.returnedEntryCount.toString()}
        />
        <SummaryCard label="Window" value={`${data.minutes} min`} />
        <SummaryCard
          label="Levels seen"
          value={data.levels.length > 0 ? data.levels.join(", ") : "None"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent TM1 message logs</CardTitle>
          <CardDescription>
            Cutoff: {formatTimestamp(data.cutoffTimestamp)}. Showing the most
            recent entries first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.entries.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
              No log entries matched the current filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 font-medium text-slate-600">
                      Time
                    </th>
                    <th className="px-4 py-3 font-medium text-slate-600">
                      Level
                    </th>
                    <th className="px-4 py-3 font-medium text-slate-600">
                      Logger
                    </th>
                    <th className="px-4 py-3 font-medium text-slate-600">
                      Message
                    </th>
                    <th className="px-4 py-3 font-medium text-slate-600">
                      Thread
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {data.entries.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-4 py-3 align-top text-slate-600">
                        {formatTimestamp(entry.timestamp)}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getLevelClassName(entry.level)}`}
                        >
                          {entry.level}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top font-medium text-slate-900">
                        {entry.logger}
                      </td>
                      <td className="px-4 py-3 align-top text-slate-700">
                        {entry.message}
                      </td>
                      <td className="px-4 py-3 align-top text-slate-600">
                        {entry.threadId ?? "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
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

const formatTimestamp = (value: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    year: "numeric",
  }).format(date);
};

const getLevelClassName = (level: string): string => {
  const normalizedLevel = level.toUpperCase();

  if (normalizedLevel === "ERROR" || normalizedLevel === "FATAL") {
    return "bg-rose-100 text-rose-800";
  }

  if (normalizedLevel === "WARNING" || normalizedLevel === "WARN") {
    return "bg-amber-100 text-amber-800";
  }

  if (normalizedLevel === "DEBUG") {
    return "bg-sky-100 text-sky-800";
  }

  return "bg-emerald-100 text-emerald-800";
};

export { RecentLogsPanel };
