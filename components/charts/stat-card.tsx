"use client";

import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";

export interface StatCardProps {
  data: any[];
}

// 数字动画 Hook
function useCountUp(end: number, duration: number = 1000) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);

      // 使用 easeOutCubic 缓动函数
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeProgress * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [end, duration]);

  return count;
}

export function StatCard({ data }: StatCardProps) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return <div className="text-sm text-muted-foreground">无数据</div>;
  }

  const firstRow = data[0];
  const columns = Object.keys(firstRow);

  // 如果只有一个字段，展示为单个 KPI 卡片
  if (columns.length === 1) {
    const key = columns[0];
    const value = Number(firstRow[key]) || 0;
    const animatedValue = useCountUp(value, 1500);

    return (
      <div className="flex items-center justify-center p-8">
        <div className="relative overflow-hidden rounded-xl border bg-card p-8 shadow-sm transition-all hover:shadow-md">
          {/* 背景装饰 */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5" />

          {/* 内容 */}
          <div className="relative space-y-2 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              {key.split('_').map(word =>
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ')}
            </p>
            <div className="flex items-baseline justify-center gap-2">
              <p className="text-5xl font-bold tracking-tight bg-gradient-to-br from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {animatedValue.toLocaleString()}
              </p>
              <TrendingUp className="h-6 w-6 text-green-600 animate-pulse" />
            </div>
          </div>

          {/* 光晕效果 */}
          <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute -bottom-12 -left-12 h-24 w-24 rounded-full bg-purple-500/20 blur-3xl" />
        </div>
      </div>
    );
  }

  // 如果有多个字段，展示为网格卡片
  const stats = columns.map(key => ({
    label: key.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' '),
    value: Number(firstRow[key]) || 0,
  }));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {stats.map((stat, index) => {
        const animatedValue = useCountUp(stat.value, 1500);

        return (
          <div
            key={stat.label}
            className="relative overflow-hidden rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md"
            style={{
              animationDelay: `${index * 100}ms`,
            }}
          >
            {/* 背景渐变 */}
            <div
              className="absolute inset-0 opacity-5"
              style={{
                background: `linear-gradient(135deg, hsl(var(--chart-${(index % 5) + 1})) 0%, transparent 100%)`,
              }}
            />

            {/* 内容 */}
            <div className="relative space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {stat.label}
              </p>
              <p className="text-3xl font-bold tracking-tight">
                {animatedValue.toLocaleString()}
              </p>
            </div>

            {/* 装饰点 */}
            <div
              className="absolute top-4 right-4 h-2 w-2 rounded-full"
              style={{
                backgroundColor: `hsl(var(--chart-${(index % 5) + 1}))`,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
