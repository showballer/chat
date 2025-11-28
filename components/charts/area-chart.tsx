"use client";

import { Area, AreaChart as RechartsAreaChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export interface AreaChartProps {
  data: any[];
  xKey: string;
  yKey: string;
}

export function AreaChart({ data, xKey, yKey }: AreaChartProps) {
  const dataKey = yKey.toLowerCase().replace(/\s+/g, "_");

  const chartConfig = {
    [dataKey]: {
      label: yKey,
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={chartConfig} className="h-[250px] w-full">
      <RechartsAreaChart data={data} accessibilityLayer>
        <defs>
          <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor={`var(--color-${dataKey})`}
              stopOpacity={0.8}
            />
            <stop
              offset="95%"
              stopColor={`var(--color-${dataKey})`}
              stopOpacity={0.1}
            />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey={xKey}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => value.toString().slice(0, 10)}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="dot" />}
        />
        <Area
          dataKey={yKey}
          type="natural"
          fill="url(#fillValue)"
          fillOpacity={0.4}
          stroke={`var(--color-${dataKey})`}
        />
      </RechartsAreaChart>
    </ChartContainer>
  );
}
