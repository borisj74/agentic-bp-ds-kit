"use client";
import type { ChartFormat, ChartTone } from "../Chart/chart";
import { XYChart, type ChartOrientation, type ChartSeries } from "../Chart/XYChart";

export type { ChartFormat, ChartSeries, ChartTone };
export type BarChartOrientation = ChartOrientation;

export interface BarChartProps {
  label: string;
  categories: string[];
  series: ChartSeries[];
  orientation?: BarChartOrientation;
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

// Figma Persona Homepages 1139:11403: stacked bars per period, legend under the chart. Horizontal lists the categories down the start.
export function BarChart(p: BarChartProps) {
  return <XYChart kind="bar" {...p} />;
}
