
import React from 'react';

export const TableRowSkeleton = () => {
  return (
    <tr className="border-b border-slate-100 dark:border-slate-800/60 animate-pulse">
      {/* 1. Select */}
      <td className="pl-6 pr-3 py-4 w-12">
        <div className="w-5 h-5 bg-slate-200 dark:bg-slate-800 rounded"></div>
      </td>
      {/* 2. Identity */}
      <td className="px-4 py-4 w-[260px]">
        <div className="flex flex-col gap-2 w-full">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
        </div>
      </td>
      {/* 3. Infrastructure */}
      <td className="px-4 py-4 w-[160px]">
        <div className="flex flex-col gap-2">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20"></div>
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-24"></div>
        </div>
      </td>
      {/* 4. Config */}
      <td className="px-4 py-4 w-[180px]">
        <div className="flex flex-col gap-2">
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
          <div className="flex gap-1">
             <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-8"></div>
             <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-8"></div>
          </div>
        </div>
      </td>
      {/* 5. State */}
      <td className="px-4 py-4 w-[160px]">
        <div className="flex flex-col gap-2">
          <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-full w-20"></div>
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-16"></div>
        </div>
      </td>
      {/* 6. Labels */}
      <td className="px-4 py-4">
        <div className="flex gap-1.5 flex-wrap">
          {[1, 2].map(i => (
            <div key={i} className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded"></div>
          ))}
        </div>
      </td>
      {/* 7. Actions */}
      <td className="pr-6 pl-4 py-4 text-right">
        <div className="flex justify-end gap-2">
          <div className="w-8 h-8 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
          <div className="w-8 h-8 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
        </div>
      </td>
    </tr>
  );
};
