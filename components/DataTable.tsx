'use client';

import { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  getRowHref?: (item: T) => string;
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  getRowHref,
  emptyMessage = 'No data available',
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  const renderRow = (item: T, index: number) => {
    const cells = columns.map((column) => (
      <td key={column.key} className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
        {column.render ? column.render(item) : item[column.key]}
      </td>
    ));

    // If there's a link, make the whole row clickable using router
    if (getRowHref) {
      const href = getRowHref(item);
      return (
        <tr
          key={index}
          onClick={() => window.location.href = href}
          className="hover:bg-gray-50 cursor-pointer"
        >
          {cells}
        </tr>
      );
    }

    // If there's an onClick handler
    if (onRowClick) {
      return (
        <tr
          key={index}
          onClick={() => onRowClick(item)}
          className="hover:bg-gray-50 cursor-pointer"
        >
          {cells}
        </tr>
      );
    }

    // Default row without click handler
    return (
      <tr key={index} className="hover:bg-gray-50">
        {cells}
      </tr>
    );
  };

  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {data.map((item, index) => renderRow(item, index))}
        </tbody>
      </table>
    </div>
  );
}