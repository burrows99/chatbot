"use client";

import {
  type ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
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

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface IData {
  id: string;
  name: string;
  availability: "online" | "away" | "busy" | "offline";
  avatar: string;
  status: "active" | "inactive";
  flag: string; // Emoji flags
  email: string;
  company: string;
  role: string;
  joined: string;
  location: string;
  balance: number;
}

export interface DataGridComponentProps {
  data: IData[];
  pageSize?: number;
  initialSorting?: SortingState;
}

export function DataGridComponent({
  data,
  pageSize = 5,
  initialSorting = [{ id: "name", desc: true }],
}: DataGridComponentProps) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  });

  const [sorting, setSorting] = useState<SortingState>(initialSorting);

  const columns = useMemo<ColumnDef<IData>[]>(
    () => [
      {
        accessorKey: "name",
        id: "name",
        header: "Name",
        cell: ({ row }) => {
          return (
            <div className="flex items-center gap-2">
              <Avatar className="size-6">
                <AvatarImage
                  alt={row.original.name}
                  src={row.original.avatar}
                />
                <AvatarFallback>
                  {row.original.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <Link
                className="text-foreground hover:text-primary font-medium"
                href="#"
              >
                {row.original.name}
              </Link>
            </div>
          );
        },
        size: 200,
        enableSorting: true,
        enableHiding: false,
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: (info) => (
          <Link
            className="hover:text-primary hover:underline"
            href={`mailto:${info.getValue()}`}
          >
            {info.getValue() as string}
          </Link>
        ),
        size: 175,
        meta: {
          headerClassName: "",
        },
      },
      {
        accessorKey: "location",
        header: "Location",
        cell: ({ row }) => {
          return (
            <div className="flex items-center gap-1.5">
              <div
                className="size-4 rounded-full bg-cover bg-center"
                style={{
                  backgroundImage: `url(https://flagcdn.com/${row.original.flag.toLowerCase()}.svg)`,
                }}
              />
              <div className="text-foreground font-medium">
                {row.original.location}
              </div>
            </div>
          );
        },
        size: 175,
        meta: {
          headerClassName: "",
          cellClassName: "text-start",
        },
      },
      {
        accessorKey: "balance",
        header: "Balance ($)",
        cell: (info) => (
          <span className="font-semibold">
            ${(info.getValue() as number).toFixed(2)}
          </span>
        ),
        size: 125,
        meta: {
          headerClassName: "text-right rtl:text-left",
          cellClassName: "text-right rtl:text-left",
        },
      },
    ],
    []
  );

  const table = useReactTable({
    columns,
    data,
    pageCount: Math.ceil((data?.length || 0) / pagination.pageSize),
    getRowId: (row: IData) => row.id,
    state: {
      pagination,
      sorting,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <DataGrid
      recordCount={data?.length || 0}
      table={table}
      tableLayout={{ dense: true }}
    >
      <div className="w-full space-y-2.5">
        <DataGridContainer>
          <DataGridScrollArea>
            <DataGridTable />
          </DataGridScrollArea>
        </DataGridContainer>
        <DataGridPagination />
      </div>
    </DataGrid>
  );
}
