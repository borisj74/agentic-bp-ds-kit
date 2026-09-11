"use client";
import type { ChartFormat, ChartTone } from "../Chart/chart";
import { XYChart, type ChartSeries } from "../Chart/XYChart";

export type { ChartFormat, ChartSeries, ChartTone };

export interface BarChartProps {
  label: string;
  categories: string[];
  series: ChartSeries[];
  stacked?: boolean;
  showValues?: boolean;
  showGrid?: boolean;
  showLegend?: boolean;
  animate?: boolean;
  format?: ChartFormat;
  currency?: string;
  height?: number;
  emptyLabel?: string;
}

// Figma Persona Homepages 1139:11403: stacked bars per period, legend under the chart.
export function BarChart(p: BarChartProps) {
  return <XYChart kind="bar" {...p} />;
}
