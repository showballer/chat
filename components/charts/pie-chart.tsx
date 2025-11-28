"use client";

import { Pie, PieChart as RechartsPieChart } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export interface PieChartProps {
  data: any[];
  nameKey: string;
  valueKey: string;
}

export function PieChart({ data, nameKey, valueKey }: PieChartProps) {
  // 构建 chartConfig
  const chartConfig = data.reduce((config, item, index) => {
    const key = String(item[nameKey]).toLowerCase().replace(/\s+/g, "_");
    config[key] = {
      label: item[nameKey],
      color: `hsl(var(--chart-${(index % 5) + 1}))`,
    };
    return config;
  }, {} as ChartConfig);

  // 准备图表数据
  const chartData = data.map((item) => {
    const key = String(item[nameKey]).toLowerCase().replace(/\s+/g, "_");
    return {
      browser: key,
      visitors: Number(item[valueKey]) || 0,
      fill: `var(--color-${key})`,
    };
  });

  return (
    <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
      <RechartsPieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Pie data={chartData} dataKey="visitors" nameKey="browser" />
      </RechartsPieChart>
    </ChartContainer>
  );
}
