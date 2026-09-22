"use client";
import type { ChartFormat, ChartTone } from "../Chart/chart";
import { XYChart, type ChartBarWidth, type ChartLegendPlace, type ChartOrientation, type ChartSeries } from "../Chart/XYChart";

export type { ChartFormat, ChartSeries, ChartTone, ChartLegendPlace };
export type BarChartOrientation = ChartOrientation;
export type BarChartBarWidth = ChartBarWidth;

export interface BarChartProps {
  label: string;
  title?: string;
  subtitle?: string;
  showTitle?: boolean;
  categories: string[];
  series: ChartSeries[];
  orientation?: BarChartOrientation;
  highlight?: number | number[];
  highlightTone?: ChartTone;
  stacked?: boolean;
  barWidth?: BarChartBarWidth;
  showValues?: boolean;
  showGrid?: boolean;
  showLegend?: boolean;
  legend?: ChartLegendPlace;
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
