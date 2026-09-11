"use client";
import type { ChartFormat, ChartTone } from "../Chart/chart";
import { XYChart, type ChartSeries } from "../Chart/XYChart";

export type { ChartFormat, ChartSeries, ChartTone };

export interface LineChartProps {
  label: string;
  categories: string[];
  series: ChartSeries[];
  area?: boolean;
  stacked?: boolean;
  showPoints?: boolean;
  showValues?: boolean;
  showGrid?: boolean;
  showLegend?: boolean;
  animate?: boolean;
  format?: ChartFormat;
  currency?: string;
  height?: number;
  emptyLabel?: string;
}

// Figma Persona Homepages 1205:14553 (lines), 1206:33138 (stacked area with points) and 996:22722 (area with values).
export function LineChart({ stacked = false, area = false, ...p }: LineChartProps) {
  // Stacked lines only read as stacks when filled, so stacked turns the area on.
  return <XYChart kind="line" {...p} stacked={stacked} area={area || stacked} />;
}
