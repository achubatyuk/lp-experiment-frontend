'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
  // getPaginationRowModel, // Removed
} from "@tanstack/react-table";
import { format, parseISO, isValid } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowUpDown, UploadCloud, MoreHorizontal } from 'lucide-react'; // Added MoreHorizontal
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Added DropdownMenu imports

// --- Type Definitions ---
interface Statement {
  id: number;
  statement_name: string;
  statement_period_from: string;
  statement_period_to: string;
  currency: string;
  initial_balance: number | null;
  final_balance: number | null;
  total_debits: number | null;
  total_credits: number | null;
  number_of_transactions: number | null;
  source_type?: string;
  source_name?: string;
  unprocessed_transactions_count?: number;
  transactions_for_review_count?: number;
}

interface Transaction {
  id: number;
  transaction_date: string;
  description: string;
  amount: number;
  balance?: number | null;
  contact_name_override?: string | null; // Keep original from API if needed elsewhere
  contact_name?: string | null; // Add this based on backend API structure
  contact_id?: number | null;
  type?: 'invoice' | 'bank fee' | 'tax' | 'salary' | 'expense' | 'sale' | 'interest' | 'loan' | 'other';
  status: 'unprocessed' | 'unreconciled' | 'matched' | 'reconciled' | 'error';
  category?: string; // You might map 'type' to this if needed
}

// --- Upload File Card ---
function UploadFileCard() {
  return (
    <Card className="min-w-[240px] max-w-xs flex-shrink-0 h-full">
      <CardHeader>
        <CardTitle className="flex items-center text-base">
          <UploadCloud className="mr-2 h-4 w-4" /> Upload File
        </CardTitle>
        <CardDescription className="text-xs">PDF, CSV, XML</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-muted rounded-lg h-28 hover:border-primary transition-colors bg-muted/20">
          <UploadCloud className="h-6 w-6 text-muted-foreground mb-1" />
          <p className="text-xs text-muted-foreground text-center">Click or Drag & Drop</p>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Clickable Statement Card ---
interface StatementSummaryCardProps {
  statement: Statement;
  isSelected: boolean;
  onSelect: (statementId: number) => void;
}
function StatementSummaryCard({ statement, isSelected, onSelect }: StatementSummaryCardProps) {
    const formatDateRange = (from: string, to: string) => {
        try { const fromDate = format(parseISO(from), 'PP'); const toDate = format(parseISO(to), 'PP'); return `${fromDate} - ${toDate}`; } catch { return `${from} - ${to}`; }
    };
    const unprocessedCount = statement.unprocessed_transactions_count ?? 'N/A';
    return (
        <Card
            className={cn("cursor-pointer hover:shadow-md transition-shadow h-full flex flex-col", isSelected && "ring-2 ring-primary shadow-md")}
            onClick={() => onSelect(statement.id)}
        >
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">{statement.statement_name}</CardTitle>
                 {statement.source_name && statement.source_type && <CardDescription className="text-xs">{statement.source_name} ({statement.source_type})</CardDescription>}
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1 pt-0 flex-grow">
                <p>Period: {formatDateRange(statement.statement_period_from, statement.statement_period_to)}</p>
                <p>Currency: {statement.currency}</p>
                {typeof statement.number_of_transactions === 'number' && <p>Total: {statement.number_of_transactions}</p>}
                <p>Unprocessed: {unprocessedCount}</p>
            </CardContent>
        </Card>
    );
}

// --- Main Page Component ---
export default function TransactionsPage() {
  const { selectedOrg } = useAuth();
  const [statements, setStatements] = useState<Statement[]>([]);
  const [isLoadingStatements, setIsLoadingStatements] = useState(false);
  const [selectedStatementId, setSelectedStatementId] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // --- Data Fetching Effects (no changes here) ---
  useEffect(() => {
    if (selectedOrg?.id) {
      setIsLoadingStatements(true); setStatements([]); setSelectedStatementId(null); setTransactions([]);
      const fetchStatements = async () => { /* ... fetch logic ... */ 
        const apiUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/organizations/${selectedOrg.id}/statements`; try { const response = await fetch(apiUrl, { credentials: 'include' }); if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`); const data = await response.json(); setStatements(Array.isArray(data) ? data : []); } catch (error) { console.error("Error fetching statements:", error); } finally { setIsLoadingStatements(false); } }; fetchStatements(); } else { setStatements([]); setSelectedStatementId(null); setTransactions([]); setIsLoadingStatements(false); } }, [selectedOrg]);
  useEffect(() => {
    if (selectedStatementId && selectedOrg?.id) {
      setIsLoadingTransactions(true); setTransactions([]);
      const fetchTransactions = async () => { /* ... fetch logic ... */
      const apiUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/statements/${selectedStatementId}/transactions`; try { const response = await fetch(apiUrl, { credentials: 'include' }); if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`); const data = await response.json(); setTransactions(Array.isArray(data) ? data : []); } catch (error) { console.error("Error fetching transactions:", error); } finally { setIsLoadingTransactions(false); } }; fetchTransactions(); } else { setTransactions([]); setIsLoadingTransactions(false); } }, [selectedStatementId, selectedOrg?.id]);

  // --- Memoized Data & Columns (MODIFIED) ---
  const selectedStatement = useMemo(() => statements.find(s => s.id === selectedStatementId) || null, [statements, selectedStatementId]);

  const columns = useMemo<ColumnDef<Transaction>[]>(() => [
    {
        accessorKey: "transaction_date",
        header: ({ column }) => (<Button variant="ghost" size="sm" className="px-2 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Date <ArrowUpDown className="ml-1 h-3 w-3" /></Button>),
        cell: ({ row }) => { // Updated Date Formatting
             const dateValue = row.getValue("transaction_date");
             if (typeof dateValue === 'string' && dateValue) {
                 try { const date = parseISO(dateValue); if (isValid(date)) return format(date, "PP"); } catch (e) { /* Log error? */ }
                 return dateValue; // Fallback to original string
             } return '---'; // Fallback for non-string/empty
        },
        size: 100,
    },
    {
        accessorKey: "description",
        header: ({ column }) => (<Button variant="ghost" size="sm" className="px-2 h-8 -ml-2" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Description <ArrowUpDown className="ml-1 h-3 w-3" /></Button>), // Added Sorting
        cell: ({ row }) => <div className="truncate" title={row.getValue("description")}>{row.getValue("description")}</div>,
        minSize: 200, size: 350
    },
    {
        accessorKey: "amount",
        header: ({ column }) => (<div className="text-right w-full"><Button variant="ghost" size="sm" className="px-2 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Amount <ArrowUpDown className="ml-1 h-3 w-3" /></Button></div>),
        cell: ({ row }) => { /* ... amount formatting ... */
             const amount = parseFloat(row.getValue("amount")); const currency = selectedStatement?.currency || "USD"; const formatted = new Intl.NumberFormat("en-US", { style: "currency", currency: currency }).format(amount); const isDebit = amount < 0; return <div className={cn("text-right font-medium", isDebit ? "text-destructive" : "text-green-600")}>{formatted}</div>; },
        size: 120,
    },
     {
        accessorKey: "balance",
        header: ({ column }) => (<div className="text-right w-full"><Button variant="ghost" size="sm" className="px-2 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Balance <ArrowUpDown className="ml-1 h-3 w-3" /></Button></div>), // Added Sorting
        cell: ({ row }) => { /* ... balance formatting ... */
             const balance = row.getValue("balance") as number | null; const currency = selectedStatement?.currency || "USD"; return <div className="text-right">{balance !== null ? new Intl.NumberFormat("en-US", { style: "currency", currency: currency }).format(balance) : '---'}</div>; },
        size: 120,
    },
    {
        accessorKey: "status",
        header: ({ column }) => (<Button variant="ghost" size="sm" className="px-2 h-8 -ml-2" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Status <ArrowUpDown className="ml-1 h-3 w-3" /></Button>), // Added Sorting
        cell: ({ row }) => { /* ... status badge ... */
             const status = row.getValue("status") as Transaction['status']; let variant: "default" | "secondary" | "outline" | "destructive" = "outline"; if (status === 'reconciled') variant = 'default'; else if (status === 'matched') variant = 'secondary'; else if (status === 'error') variant = 'destructive'; return <Badge variant={variant} className="text-xs">{status}</Badge>; },
        size: 100,
    },
    {
        accessorKey: "type", // Assuming 'type' holds the category
        header: ({ column }) => (<Button variant="ghost" size="sm" className="px-2 h-8 -ml-2" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Category <ArrowUpDown className="ml-1 h-3 w-3" /></Button>), // Added Sorting
        cell: ({ row }) => <div className="truncate">{row.original.type || '---'}</div>,
        size: 100,
    },
    {
        accessorKey: "contact_name", // Corrected accessorKey
        header: ({ column }) => (<Button variant="ghost" size="sm" className="px-2 h-8 -ml-2" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Contact <ArrowUpDown className="ml-1 h-3 w-3" /></Button>), // Added Sorting
        cell: ({ row }) => <div className="truncate">{row.getValue("contact_name") || '---'}</div>,
        size: 150,
    },
    // Added Actions Column
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>, // Optional header
      cell: ({ row }) => {
        const transaction = row.original;
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => console.log('View transaction', transaction.id)}>
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => console.log('Edit transaction', transaction.id)}>
                  Edit
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
      size: 50,
    }
  ], [selectedStatement?.currency]);

  // --- Table Instance (Removed pagination model) ---
  const table = useReactTable({
    data: transactions,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    defaultColumn: { size: 150, minSize: 50, maxSize: 500 }
  });

  // --- Render Logic ---
  if (!selectedOrg) return <div className="p-6 text-center text-muted-foreground">Please select an organization.</div>;

  return (
    // Removed gap-4 from root div
    <div className="flex flex-col h-full">
      {/* Top Row */}
      <div className="flex flex-col xl:flex-row gap-4 mb-4">
        <UploadFileCard />
        <div className="flex-1">
             {/* Removed <h3>Statements</h3> header */}
            {isLoadingStatements ? ( <div className="h-32 flex items-center justify-center text-muted-foreground rounded-lg border border-dashed">Loading statements...</div> )
             : statements.length > 0 ? ( <ScrollArea className="w-full whitespace-nowrap pb-4"> <div className="flex space-x-4"> {statements.map(stmt => ( <div key={stmt.id} className="min-w-[240px] max-w-xs flex-shrink-0 h-full"> <StatementSummaryCard statement={stmt} isSelected={selectedStatementId === stmt.id} onSelect={setSelectedStatementId} /> </div> ))} </div> <ScrollBar orientation="horizontal" /> </ScrollArea> )
             : ( <div className="h-32 flex items-center justify-center text-muted-foreground rounded-lg border border-dashed">No statements found.</div> )}
        </div>
      </div>

      {/* Bottom Section: Transactions Table (MODIFIED SCROLLING) */}
      <div className="flex-1 flex flex-col min-h-0 border rounded-lg shadow-sm bg-card">
        {/* Table Header Area - Removed H3 Title */}
        <div className="flex items-center p-3 gap-2 border-b">
            <span className="flex-1 text-sm font-medium text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis" title={selectedStatement ? `Viewing: ${selectedStatement.statement_name}` : 'Select a statement'}>
                {selectedStatement ? `Viewing: ${selectedStatement.statement_name}` : 'Select a statement'}
            </span>
            <Input placeholder="Filter descriptions..." value={(table.getColumn("description")?.getFilterValue() as string) ?? ""} onChange={(event) => table.getColumn("description")?.setFilterValue(event.target.value)} className="max-w-xs h-8" disabled={!selectedStatementId} />
        </div>
        {/* Scrollable Table Body Area (Direct overflow) */}
        <div className="flex-1 overflow-y-auto"> {/* Apply scroll directly here */}
            <Table>
                <TableHeader className="sticky top-0 z-10 bg-card shadow-sm">
                {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} style={{width: `${header.getSize()}px`}} className="whitespace-nowrap px-2 py-2 text-xs h-9">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                    ))}
                    </TableRow>
                ))}
                </TableHeader>
                <TableBody>
                {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                        {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} style={{width: `${cell.column.getSize()}px`}} className="whitespace-nowrap px-2 py-1 text-xs h-9">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                        ))}
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center text-sm text-muted-foreground">
                        {isLoadingTransactions ? "Loading..." : !selectedStatementId ? "Select a statement above to view transactions." : "No transactions found."}
                    </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
        </div>
        {/* Footer (Removed Pagination) */}
        <div className="flex items-center justify-end p-2 border-t">
             <span className="text-xs text-muted-foreground">
                Total: {table.getFilteredRowModel().rows.length} transaction(s)
            </span>
        </div>
      </div>
    </div>
  );
}
