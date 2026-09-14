"use client";
import type { ChartFormat, ChartTone } from "../Chart/chart";
import { XYChart, type ChartLegendPlace, type ChartLineSeries, type ChartMarker, type ChartReferenceLine } from "../Chart/XYChart";

export type { ChartFormat, ChartTone, ChartLegendPlace, ChartMarker, ChartReferenceLine };
// A LineChart series can turn into a forecast part way: projectedFrom.
export type ChartSeries = ChartLineSeries;

export interface LineChartProps {
  label: string;
  title?: string;
  subtitle?: string;
  showTitle?: boolean;
  categories: string[];
  series: ChartSeries[];
  area?: boolean;
  stacked?: boolean;
  showPoints?: boolean;
  showValues?: boolean;
  showGrid?: boolean;
  showLegend?: boolean;
  legend?: ChartLegendPlace;
  animate?: boolean;
  format?: ChartFormat;
  currency?: string;
  height?: number;
  emptyLabel?: string;
  referenceLines?: ChartReferenceLine[];
  marker?: ChartMarker;
}

// Figma Persona Homepages 1205:14553 (lines), 1206:33138 (stacked area with points) and 996:22722 (area with values).
export function LineChart({ stacked = false, area = false, ...p }: LineChartProps) {
  // Stacked lines only read as stacks when filled, so stacked turns the area on.
  return <XYChart kind="line" {...p} stacked={stacked} area={area || stacked} />;
}
