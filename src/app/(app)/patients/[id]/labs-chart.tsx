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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronDown, Pill, Plus } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Lab, Medication } from "@/lib/types";
import { LabPanelForm } from "./lab-panel-form";
import { MedicationForm } from "./medication-form";

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

// Parse a YYYY-MM-DD ISO date at UTC noon so every timezone falls on the
// intended calendar day on the axis.
function toTs(iso: string): number {
  return Date.parse(`${iso}T12:00:00Z`);
}

function tsToIso(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

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
  patientId,
  labNameSuggestions,
  medicationNameSuggestions,
}: {
  labs: Lab[];
  medications: Medication[];
  patientId: string;
  labNameSuggestions: string[];
  medicationNameSuggestions: string[];
}) {
  const [labPanelOpen, setLabPanelOpen] = React.useState(false);
  const [medicationFormOpen, setMedicationFormOpen] = React.useState(false);
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
      const row =
        byDate.get(lab.drawn_at) ?? {
          date: lab.drawn_at,
          t: toTs(lab.drawn_at),
        };
      row[lab.lab_name] = lab.value;
      byDate.set(lab.drawn_at, row);
    }
    const rows = Array.from(byDate.values());
    rows.sort((a, b) => (a.t as number) - (b.t as number));
    return rows;
  }, [labs, selected]);

  const xDomain = React.useMemo<[number, number] | undefined>(() => {
    const ts: number[] = [];
    for (const row of chartData) ts.push(row.t as number);
    for (const d of medEventsByDate.keys()) ts.push(toTs(d));
    if (ts.length === 0) return undefined;
    const min = Math.min(...ts);
    const max = Math.max(...ts);
    const pad = Math.max((max - min) * 0.02, 24 * 3600 * 1000);
    return [min - pad, max + pad];
  }, [chartData, medEventsByDate]);

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
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Labs over time</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Flags mark medication changes. Click one for details.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => setLabPanelOpen(true)}>
            <Plus className="h-4 w-4" />
            Lab panel
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setMedicationFormOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Medication
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                {selected.length} lab{selected.length === 1 ? "" : "s"}
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
        </div>
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
                margin={{ top: 28, right: 16, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="t"
                  type="number"
                  scale="time"
                  domain={xDomain}
                  tickFormatter={(v: number) => formatDate(tsToIso(v))}
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
                {Array.from(medEventsByDate.entries()).map(([date, events]) => {
                  const active = activeMarker === date;
                  return (
                    <ReferenceLine
                      key={date}
                      x={toTs(date)}
                      stroke={active ? "#d97706" : "#9ca3af"}
                      strokeDasharray="4 4"
                      strokeWidth={active ? 1.5 : 1}
                      label={(labelProps: { viewBox?: { x?: number; y?: number } }) => (
                        <FlagMarker
                          viewBox={labelProps.viewBox}
                          count={events.length}
                          active={active}
                          onClick={() =>
                            setActiveMarker(active ? null : date)
                          }
                        />
                      )}
                    />
                  );
                })}
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

      <LabPanelForm
        open={labPanelOpen}
        onOpenChange={setLabPanelOpen}
        patientId={patientId}
        nameSuggestions={labNameSuggestions}
        labs={labs}
      />
      <MedicationForm
        mode="create"
        patientId={patientId}
        open={medicationFormOpen}
        onOpenChange={setMedicationFormOpen}
        nameSuggestions={medicationNameSuggestions}
      />
    </Card>
  );
}

function FlagMarker({
  viewBox,
  count,
  active,
  onClick,
}: {
  viewBox?: { x?: number; y?: number };
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  if (!viewBox || viewBox.x == null || viewBox.y == null) return null;
  const { x, y } = viewBox;
  const size = 18;
  const bg = active ? "#d97706" : "#ffffff";
  const stroke = active ? "#b45309" : "#9ca3af";
  const iconColor = active ? "#ffffff" : "#4b5563";
  return (
    <g
      transform={`translate(${x - size / 2}, ${y - size - 2})`}
      style={{ cursor: "pointer" }}
      onClick={onClick}
    >
      <title>
        {count} medication change{count === 1 ? "" : "s"} · click for details
      </title>
      <rect
        width={size}
        height={size}
        rx={4}
        fill={bg}
        stroke={stroke}
        strokeWidth={1.2}
      />
      {/* Lucide-style flag, scaled to fit inside the badge */}
      <g
        transform={`translate(${size / 2 - 6}, ${size / 2 - 6}) scale(0.5)`}
        stroke={iconColor}
        fill="none"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        pointerEvents="none"
      >
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1={4} y1={22} x2={4} y2={15} />
      </g>
      {count > 1 && (
        <g pointerEvents="none">
          <circle cx={size - 1} cy={1} r={5.5} fill="#dc2626" />
          <text
            x={size - 1}
            y={3.5}
            textAnchor="middle"
            fontSize={7.5}
            fontWeight={700}
            fill="#ffffff"
          >
            {count}
          </text>
        </g>
      )}
    </g>
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
  const iso = typeof label === "number" ? tsToIso(label) : String(label);
  const events = medEventsByDate.get(iso);
  return (
    <div className="rounded-md border bg-popover p-2 text-xs text-popover-foreground shadow-md">
      <div className="mb-1 font-medium">{formatDate(iso)}</div>
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
