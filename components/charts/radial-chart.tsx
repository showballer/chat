"use client";

import { Label, PolarRadiusAxis, RadialBar, RadialBarChart as RechartsRadialBarChart } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export interface RadialChartProps {
  data: any[];
  nameKey: string;
  valueKey: string;
}

export function RadialChart({ data, nameKey, valueKey }: RadialChartProps) {
  // 构建 chartConfig
  const chartConfig = data.reduce((config, item, index) => {
    const key = String(item[nameKey]).toLowerCase().replace(/\s+/g, "_");
    config[key] = {
      label: item[nameKey],
      color: `hsl(var(--chart-${(index % 5) + 1}))`,
    };
    return config;
  }, {} as ChartConfig);

  // 准备图表数据 - 将所有数据合并到一个对象中用于 stacked radial bar
  const chartData = [
    data.reduce((acc, item) => {
      const key = String(item[nameKey]).toLowerCase().replace(/\s+/g, "_");
      acc[key] = Number(item[valueKey]) || 0;
      return acc;
    }, {} as Record<string, number>),
  ];

  // 计算总数
  const totalValue = data.reduce((sum, item) => sum + (Number(item[valueKey]) || 0), 0);

  return (
    <ChartContainer config={chartConfig} className="mx-auto aspect-square w-full max-w-[250px]">
      <RechartsRadialBarChart
        data={chartData}
        endAngle={180}
        innerRadius={80}
        outerRadius={130}
      >
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
          <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                  <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) - 16}
                      className="fill-foreground text-2xl font-bold"
                    >
                      {totalValue.toLocaleString()}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 4}
                      className="fill-muted-foreground"
                    >
                      Total
                    </tspan>
                  </text>
                );
              }
            }}
          />
        </PolarRadiusAxis>
        {data.map((item, index) => {
          const key = String(item[nameKey]).toLowerCase().replace(/\s+/g, "_");
          return (
            <RadialBar
              key={key}
              dataKey={key}
              stackId="a"
              cornerRadius={5}
              fill={`var(--color-${key})`}
              className="stroke-transparent stroke-2"
            />
          );
        })}
      </RechartsRadialBarChart>
    </ChartContainer>
  );
}
