'use client';

import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type { ClassAttendanceSummary } from '../types';

interface ClassSummaryCardProps {
  summary: ClassAttendanceSummary;
  isSelected: boolean;
  onClick: () => void;
}

export function ClassSummaryCard({
  summary,
  isSelected,
  onClick,
}: ClassSummaryCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full rounded-lg border-2 p-4 text-left transition-all',
        isSelected
          ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-gray-900">{summary.className}</p>
          <p className="text-sm text-gray-500">{summary.gradeName}</p>
        </div>
        {summary.recorded ? (
          <Badge variant="success">Recorded</Badge>
        ) : (
          <Badge variant="warning">Pending</Badge>
        )}
      </div>

      <div className="mt-3 flex items-center gap-4">
        <div className="flex items-center gap-1 text-sm">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-gray-600">{summary.present}</span>
        </div>
        <div className="flex items-center gap-1 text-sm">
          <div className="h-2 w-2 rounded-full bg-red-500" />
          <span className="text-gray-600">{summary.absent}</span>
        </div>
        <div className="flex items-center gap-1 text-sm">
          <div className="h-2 w-2 rounded-full bg-amber-500" />
          <span className="text-gray-600">{summary.late}</span>
        </div>
        <div className="ml-auto text-right">
          <span
            className={cn(
              'text-lg font-bold',
              summary.rate >= 90
                ? 'text-green-600'
                : summary.rate >= 75
                  ? 'text-amber-600'
                  : 'text-red-600'
            )}
          >
            {summary.rate.toFixed(0)}%
          </span>
        </div>
      </div>
    </button>
  );
}
