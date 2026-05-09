"use client";

import {
  type ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  DataGrid,
  DataGridContainer,
} from "@/components/reui/data-grid/data-grid";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table";

export interface DataGridColumn {
  key: string;
  header: string;
  type?: "text" | "link" | "badge" | "number" | "date";
  /** For type "link": which key holds the href */
  hrefKey?: string;
  width?: number;
  align?: "left" | "right" | "center";
}

export interface DataGridComponentProps {
  title?: string;
  columns: DataGridColumn[];
  rows: Record<string, unknown>[];
  pageSize?: number;
}

export function DataGridComponent({
  title,
  columns = [],
  rows = [],
  pageSize = 10,
}: DataGridComponentProps) {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize,
  });

  const [sorting, setSorting] = useState<{ id: string; desc: boolean }[]>([]);

  const colDefs = useMemo<ColumnDef<Record<string, unknown>>[]>(
    () =>
      columns.map((col) => ({
        accessorKey: col.key,
        header: col.header,
        size: col.width,
        meta: {
          headerClassName:
            col.align === "right" ? "text-right rtl:text-left" : "",
          cellClassName:
            col.align === "right" ? "text-right rtl:text-left" : "",
        },
        cell: (info) => {
          const value = info.getValue();
          if (col.type === "link" && col.hrefKey) {
            const href = info.row.original[col.hrefKey] as string;
            return (
              <Link
                className="hover:text-primary hover:underline truncate"
                href={href}
                rel="noreferrer"
                target="_blank"
              >
                {String(value ?? "")}
              </Link>
            );
          }
          if (col.type === "number") {
            return (
              <span className="font-semibold">
                {typeof value === "number"
                  ? value.toLocaleString()
                  : String(value ?? "")}
              </span>
            );
          }
          return <span>{String(value ?? "")}</span>;
        },
      })),
    [columns]
  );

  const table = useReactTable({
    columns: colDefs,
    data: rows,
    pageCount: Math.ceil(rows.length / pagination.pageSize),
    getRowId: (row, idx) => String(row.id ?? idx),
    state: { pagination, sorting },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="flex flex-col gap-3">
      {title && (
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
      )}
      <DataGrid recordCount={rows.length} table={table}>
        <div className="w-full space-y-2.5">
          <DataGridContainer>
            <DataGridScrollArea>
              <DataGridTable />
            </DataGridScrollArea>
          </DataGridContainer>
          <DataGridPagination />
        </div>
      </DataGrid>
    </div>
  );
}
