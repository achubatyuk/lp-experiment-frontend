import React from "react";
import {
  ColumnDef,
  flexRender,
  Table as ReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataTableProps<TData, TValue> {
  table: ReactTable<TData>; 
  columns: ColumnDef<TData, TValue>[];
  // Removed tableHeight prop implicitly by removing its usage
}

export function DataTable<TData, TValue>({
  table,
  columns,
}: DataTableProps<TData, TValue>) {

  return (
    // Removed flex-1, min-h-0, flex, flex-col from root div
    <div className={cn("rounded-md border overflow-hidden")}> 
      {/* Removed flex-grow, added max-height with viewport units */}
      <div className="relative overflow-auto max-h-[65vh]"> 
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card shadow-sm">{
            table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>{ 
                headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="h-10 whitespace-nowrap">
                    <div className="flex items-center">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      {header.column.getCanSort() && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1 h-auto ml-2"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {{
                            asc: <ChevronUp className="w-3 h-3" />,
                            desc: <ChevronDown className="w-3 h-3" />,
                          }[header.column.getIsSorted() as string] ?? (
                            <ChevronDown className="w-3 h-3 text-muted-foreground/30" />
                          )}
                        </Button>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))
          }</TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="whitespace-nowrap">
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
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
