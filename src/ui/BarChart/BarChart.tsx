"use client";
import type { ChartFormat, ChartIntent } from "../Chart/chart";
import { XYChart, type ChartBarWidth, type ChartLegendPosition, type ChartOrientation, type ChartSeries } from "../Chart/XYChart";

export type { ChartFormat, ChartSeries, ChartIntent, ChartLegendPosition };
export type BarChartOrientation = ChartOrientation;
export type BarChartBarWidth = ChartBarWidth;

export interface BarChartProps {
  label: string;
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
  categories: string[];
  series: ChartSeries[];
  orientation?: BarChartOrientation;
  highlight?: number | number[];
  highlightIntent?: ChartIntent;
  stacked?: boolean;
  barWidth?: BarChartBarWidth;
  showValues?: boolean;
  showGrid?: boolean;
  showLegend?: boolean;
  legendPosition?: ChartLegendPosition;
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
