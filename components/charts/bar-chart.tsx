"use client";

import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export interface BarChartProps {
  data: any[];
  xKey: string;
  yKey: string;
}

export function BarChart({ data, xKey, yKey }: BarChartProps) {
  const dataKey = yKey.toLowerCase().replace(/\s+/g, "_");

  const chartConfig = {
    [dataKey]: {
      label: yKey,
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={chartConfig} className="h-[250px] w-full">
      <RechartsBarChart data={data} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey={xKey}
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.toString().slice(0, 10)}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Bar dataKey={yKey} fill={`var(--color-${dataKey})`} radius={8} />
      </RechartsBarChart>
    </ChartContainer>
  );
}
