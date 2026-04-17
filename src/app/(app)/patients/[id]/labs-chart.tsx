"use client";

import * as React from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronDown, Pill } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Lab, Medication } from "@/lib/types";

const PALETTE = [
  "#0d9488", // teal-600
  "#2563eb", // blue-600
  "#db2777", // pink-600
  "#d97706", // amber-600
  "#7c3aed", // violet-600
  "#dc2626", // red-600
  "#059669", // emerald-600
  "#0891b2", // cyan-600
];

type MedEvent = {
  date: string;
  kind: "start" | "stop";
  med: Medication;
};

function buildMedEvents(meds: Medication[]): MedEvent[] {
  const events: MedEvent[] = [];
  for (const m of meds) {
    events.push({ date: m.start_date, kind: "start", med: m });
    if (m.end_date) {
      events.push({ date: m.end_date, kind: "stop", med: m });
    }
  }
  return events.sort((a, b) => a.date.localeCompare(b.date));
}

function groupByDate(events: MedEvent[]): Map<string, MedEvent[]> {
  const map = new Map<string, MedEvent[]>();
  for (const e of events) {
    const list = map.get(e.date) ?? [];
    list.push(e);
    map.set(e.date, list);
  }
  return map;
}

export function LabsChart({
  labs,
  medications,
}: {
  labs: Lab[];
  medications: Medication[];
}) {
  const allLabNames = React.useMemo(() => {
    const names = Array.from(new Set(labs.map((l) => l.lab_name)));
    names.sort();
    return names;
  }, [labs]);

  // Default: most recently entered 3–4 unique lab names
  const defaultSelected = React.useMemo(() => {
    const seen = new Set<string>();
    const ordered: string[] = [];
    const sorted = [...labs].sort((a, b) =>
      b.drawn_at.localeCompare(a.drawn_at),
    );
    for (const l of sorted) {
      if (!seen.has(l.lab_name)) {
        seen.add(l.lab_name);
        ordered.push(l.lab_name);
        if (ordered.length >= 4) break;
      }
    }
    return ordered;
  }, [labs]);

  const [selected, setSelected] = React.useState<string[]>(defaultSelected);

  React.useEffect(() => {
    setSelected(defaultSelected);
  }, [defaultSelected]);

  const [activeMarker, setActiveMarker] = React.useState<string | null>(null);

  const medEvents = React.useMemo(() => buildMedEvents(medications), [medications]);
  const medEventsByDate = React.useMemo(() => groupByDate(medEvents), [medEvents]);

  const chartData = React.useMemo(() => {
    const byDate = new Map<string, Record<string, number | string | null>>();
    for (const lab of labs) {
      if (!selected.includes(lab.lab_name)) continue;
      const row = byDate.get(lab.drawn_at) ?? { date: lab.drawn_at };
      row[lab.lab_name] = lab.value;
      byDate.set(lab.drawn_at, row);
    }
    const rows = Array.from(byDate.values());
    rows.sort((a, b) =>
      String(a.date).localeCompare(String(b.date)),
    );
    return rows;
  }, [labs, selected]);

  // For reference ranges: use the most common range across the selected labs.
  const referenceRanges = React.useMemo(() => {
    const map = new Map<string, { low?: number; high?: number }>();
    for (const name of selected) {
      const entries = labs.filter(
        (l) =>
          l.lab_name === name &&
          (l.reference_range_low != null || l.reference_range_high != null),
      );
      if (entries.length === 0) continue;
      const latest = entries.sort((a, b) => b.drawn_at.localeCompare(a.drawn_at))[0];
      map.set(name, {
        low: latest.reference_range_low ?? undefined,
        high: latest.reference_range_high ?? undefined,
      });
    }
    return map;
  }, [labs, selected]);

  const colorFor = React.useCallback(
    (name: string) => PALETTE[allLabNames.indexOf(name) % PALETTE.length],
    [allLabNames],
  );

  const hasData = chartData.length > 0;
  const singleLab = selected.length === 1 ? selected[0] : null;
  const singleRange = singleLab ? referenceRanges.get(singleLab) : undefined;

  function toggle(name: string) {
    setSelected((cur) =>
      cur.includes(name) ? cur.filter((n) => n !== name) : [...cur, name],
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Labs over time</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Vertical markers indicate medication changes. Click one for details.
          </p>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              {selected.length} lab{selected.length === 1 ? "" : "s"} selected
              <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64">
            <div className="space-y-1 max-h-72 overflow-y-auto">
              {allLabNames.length === 0 ? (
                <p className="p-2 text-sm text-muted-foreground">
                  No labs yet.
                </p>
              ) : (
                allLabNames.map((name) => (
                  <label
                    key={name}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent"
                  >
                    <Checkbox
                      checked={selected.includes(name)}
                      onCheckedChange={() => toggle(name)}
                    />
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: colorFor(name) }}
                    />
                    <span className="text-sm">{name}</span>
                  </label>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
            {allLabNames.length === 0
              ? "Add lab entries below to see trends here."
              : "Select one or more labs to plot."}
          </div>
        ) : (
          <div className="h-[22rem] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 16, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => formatDate(v)}
                  tick={{ fontSize: 12 }}
                  minTickGap={24}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  content={(props) => (
                    <ChartTooltip
                      {...props}
                      medEventsByDate={medEventsByDate}
                    />
                  )}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12 }}
                  iconType="line"
                  verticalAlign="top"
                  align="right"
                />
                {singleLab && singleRange?.low != null && singleRange?.high != null && (
                  <ReferenceArea
                    y1={singleRange.low}
                    y2={singleRange.high}
                    fill={colorFor(singleLab)}
                    fillOpacity={0.08}
                    stroke="none"
                  />
                )}
                {Array.from(medEventsByDate.entries()).map(([date, events]) => (
                  <ReferenceLine
                    key={date}
                    x={date}
                    stroke="#6b7280"
                    strokeDasharray="4 4"
                    ifOverflow="extendDomain"
                    label={{
                      value: "Rx",
                      position: "insideTop",
                      fill: "#6b7280",
                      fontSize: 10,
                    }}
                    onClick={() => setActiveMarker(date)}
                    style={{ cursor: "pointer" }}
                  />
                ))}
                {selected.map((name) => (
                  <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={colorFor(name)}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                    connectNulls
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Medication change timeline, clickable, with marker popover below */}
        {medEvents.length > 0 && (
          <div className="mt-4 border-t pt-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Pill className="h-3.5 w-3.5" />
              Medication timeline
            </div>
            <div className="flex flex-wrap gap-2">
              {Array.from(medEventsByDate.entries()).map(([date, events]) => (
                <button
                  key={date}
                  type="button"
                  onClick={() =>
                    setActiveMarker(activeMarker === date ? null : date)
                  }
                  className={`rounded-md border px-2 py-1 text-xs transition-colors ${
                    activeMarker === date
                      ? "border-primary bg-primary/10 text-primary"
                      : "hover:bg-accent"
                  }`}
                >
                  {formatDate(date)} · {events.length} change
                  {events.length === 1 ? "" : "s"}
                </button>
              ))}
            </div>
            {activeMarker && (
              <div className="mt-3 rounded-md border bg-muted/40 p-3 text-sm">
                <div className="mb-2 font-medium">
                  {formatDate(activeMarker)}
                </div>
                <ul className="space-y-1.5">
                  {(medEventsByDate.get(activeMarker) ?? []).map((e, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Badge kind={e.kind} />
                      <div>
                        <span className="font-medium">{e.med.name}</span>
                        {e.med.dose != null && (
                          <span className="text-muted-foreground">
                            {" "}
                            · {e.med.dose}
                            {e.med.unit ? ` ${e.med.unit}` : ""}
                          </span>
                        )}
                        {e.med.frequency && (
                          <span className="text-muted-foreground">
                            {" "}
                            · {e.med.frequency}
                          </span>
                        )}
                        {e.med.notes && (
                          <div className="text-xs text-muted-foreground">
                            {e.med.notes}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Badge({ kind }: { kind: "start" | "stop" }) {
  const styles =
    kind === "start"
      ? "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200"
      : "bg-muted text-muted-foreground";
  return (
    <span
      className={`mt-0.5 inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${styles}`}
    >
      {kind === "start" ? "Started" : "Stopped"}
    </span>
  );
}

type TooltipItem = {
  dataKey?: string | number;
  value?: number | string | (number | string)[];
  color?: string;
};

function ChartTooltip({
  active,
  payload,
  label,
  medEventsByDate,
}: {
  active?: boolean;
  payload?: TooltipItem[];
  label?: string | number;
  medEventsByDate: Map<string, MedEvent[]>;
}) {
  if (!active || !payload || payload.length === 0 || label == null) return null;
  const labelStr = String(label);
  const events = medEventsByDate.get(labelStr);
  return (
    <div className="rounded-md border bg-popover p-2 text-xs text-popover-foreground shadow-md">
      <div className="mb-1 font-medium">{formatDate(labelStr)}</div>
      <ul className="space-y-0.5">
        {payload.map((p, i) => (
          <li key={String(p.dataKey ?? i)} className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: p.color }}
            />
            <span>{String(p.dataKey ?? "")}:</span>
            <span className="font-medium">{String(p.value ?? "")}</span>
          </li>
        ))}
      </ul>
      {events && events.length > 0 && (
        <div className="mt-1 border-t pt-1 text-muted-foreground">
          {events.length} medication change{events.length === 1 ? "" : "s"}
        </div>
      )}
    </div>
  );
}
