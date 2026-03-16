'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import type { WeeklyTrend } from '../types';

interface WeeklyTrendChartProps {
  data: WeeklyTrend[];
}

export function WeeklyTrendChart({ data }: WeeklyTrendChartProps) {
  const maxRate = Math.max(...data.map((d) => d.rate), 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">This Week's Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-2 h-32">
          {data.map((day, idx) => (
            <div
              key={idx}
              className="flex flex-1 flex-col items-center gap-1"
            >
              <span className="text-xs font-medium text-gray-900">
                {day.rate > 0 ? `${day.rate.toFixed(0)}%` : '-'}
              </span>
              <div
                className={cn(
                  'w-full rounded-t transition-all',
                  day.rate >= 90
                    ? 'bg-green-500'
                    : day.rate >= 75
                      ? 'bg-amber-500'
                      : day.rate > 0
                        ? 'bg-red-500'
                        : 'bg-gray-200'
                )}
                style={{
                  height: `${(day.rate / maxRate) * 100}%`,
                  minHeight: day.rate > 0 ? '8px' : '4px',
                }}
              />
              <span className="text-xs text-gray-500">{day.dayName}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
