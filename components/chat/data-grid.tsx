"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface IData {
  id: string;
  name: string;
  availability: "online" | "away" | "busy" | "offline";
  avatar: string;
  status: "active" | "inactive";
  flag: string;
  email: string;
  company: string;
  role: string;
  joined: string;
  location: string;
  balance: number;
  url: string;
}

export interface DataGridComponentProps {
  data: IData[];
  pageSize?: number;
  initialSorting?: SortingState;
}

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100];

export function DataGridComponent({
  data,
  pageSize = 5,
  initialSorting = [],
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
        header: ({ column }) => (
          <Button
            className="-ml-3 h-8 px-2"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
            size="sm"
            variant="ghost"
          >
            Name
            <ArrowUpDown className="ml-2 size-3.5" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Avatar className="size-6">
              <AvatarImage alt={row.original.name} src={row.original.avatar} />
              <AvatarFallback>
                {row.original.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            {row.original.url ? (
              <Link
                className="font-medium text-foreground hover:text-primary"
                href={row.original.url}
                rel="noopener noreferrer"
                target="_blank"
              >
                {row.original.name}
              </Link>
            ) : (
              <span className="font-medium text-foreground">
                {row.original.name}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "location",
        header: "Location",
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            {row.original.flag && (
              <div
                className="size-4 rounded-full bg-cover bg-center"
                style={{
                  backgroundImage: `url(https://flagcdn.com/${row.original.flag.toLowerCase()}.svg)`,
                }}
              />
            )}
            <span className="font-medium text-foreground">
              {row.original.location}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "balance",
        header: ({ column }) => (
          <Button
            className="-mr-3 h-8 w-full justify-end px-2"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
            size="sm"
            variant="ghost"
          >
            Balance ($)
            <ArrowUpDown className="ml-2 size-3.5" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-right font-semibold">
            ${row.original.balance.toFixed(2)}
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    getRowId: (row) => row.id,
    state: { pagination, sorting },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const rowCount = data.length;
  const currentPageSize = pagination.pageSize;
  const currentPageIndex = pagination.pageIndex;
  const pageCount = table.getPageCount();
  const from = rowCount === 0 ? 0 : currentPageIndex * currentPageSize + 1;
  const to = Math.min((currentPageIndex + 1) * currentPageSize, rowCount);

  return (
    <div className="w-full space-y-2.5">
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  key={row.id}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  className="h-24 text-center text-muted-foreground"
                  colSpan={columns.length}
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-4 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>Rows per page</span>
          <Select
            onValueChange={(value) => table.setPageSize(Number(value))}
            value={`${currentPageSize}`}
          >
            <SelectTrigger className="h-8 w-20" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-muted-foreground">
            {from} – {to} of {rowCount}
          </span>
          <div className="flex items-center gap-1">
            <Button
              className="size-7 p-0"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
              size="icon-sm"
              variant="ghost"
            >
              <ChevronLeftIcon className="size-4" />
              <span className="sr-only">Previous page</span>
            </Button>
            <span
              className={cn(
                "min-w-[5ch] text-center font-medium",
                pageCount === 0 && "text-muted-foreground"
              )}
            >
              {pageCount === 0 ? "-" : `${currentPageIndex + 1} / ${pageCount}`}
            </span>
            <Button
              className="size-7 p-0"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
              size="icon-sm"
              variant="ghost"
            >
              <ChevronRightIcon className="size-4" />
              <span className="sr-only">Next page</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
