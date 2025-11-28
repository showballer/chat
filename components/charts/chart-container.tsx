"use client";

import { useState } from "react";
import { AreaChart } from "./area-chart";
import { BarChart } from "./bar-chart";
import { PieChart } from "./pie-chart";
import { RadialChart } from "./radial-chart";
import { StatCard } from "./stat-card";

export type ChartType = "area" | "bar" | "pie" | "radial" | "stat";

export interface ChartConfig {
  type: ChartType;
  data: any[];
  xKey?: string;
  yKey?: string;
  nameKey?: string;
  valueKey?: string;
  color?: string;
  colors?: string[];
  // 支持切换的图表类型
  supportedTypes?: ChartType[];
}

// 自动判断哪些图表类型可以相互切换
function getSupportedTypes(config: ChartConfig): ChartType[] {
  if (config.supportedTypes && config.supportedTypes.length > 0) {
    return config.supportedTypes;
  }

  // 如果有 xKey 和 yKey，支持 Area 和 Bar 切换
  if (config.xKey && config.yKey) {
    return ["area", "bar"];
  }

  // 如果有 nameKey 和 valueKey，支持 Pie 和 Radial 切换
  if (config.nameKey && config.valueKey) {
    return ["pie", "radial"];
  }

  // 默认不支持切换
  return [config.type];
}

export function ChartContainer({ config }: { config: ChartConfig }) {
  const supportedTypes = getSupportedTypes(config);
  const [currentType, setCurrentType] = useState<ChartType>(config.type);

  const renderChart = () => {
    switch (currentType) {
      case "area":
        return (
          <AreaChart
            data={config.data}
            xKey={config.xKey!}
            yKey={config.yKey!}
            color={config.color}
          />
        );
      case "bar":
        return (
          <BarChart
            data={config.data}
            xKey={config.xKey!}
            yKey={config.yKey!}
            color={config.color}
          />
        );
      case "pie":
        return (
          <PieChart
            data={config.data}
            nameKey={config.nameKey!}
            valueKey={config.valueKey!}
            colors={config.colors}
          />
        );
      case "radial":
        return (
          <RadialChart
            data={config.data}
            nameKey={config.nameKey!}
            valueKey={config.valueKey!}
            colors={config.colors}
          />
        );
      case "stat":
        return <StatCard data={config.data} />;
      default:
        return <div className="text-sm text-muted-foreground">不支持的图表类型</div>;
    }
  };

  const typeLabels: Record<ChartType, string> = {
    area: "面积图",
    bar: "柱状图",
    pie: "饼图",
    radial: "径向图",
    stat: "数据卡片",
  };

  return (
    <div className="space-y-4">
      {/* 图表类型切换 */}
      {supportedTypes.length > 1 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">图表类型:</span>
          <div className="flex flex-wrap gap-2">
            {supportedTypes.map((type) => (
              <button
                key={type}
                onClick={() => setCurrentType(type)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  currentType === type
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {typeLabels[type]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 图表渲染区 */}
      <div className="w-full">{renderChart()}</div>
    </div>
  );
}
