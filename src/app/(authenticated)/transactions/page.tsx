'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender
} from "@tanstack/react-table";
import { format, parseISO, isValid, startOfDay, endOfDay } from 'date-fns';
import { DataTable } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChevronDown, MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";

// --- Type Definitions ---
interface Statement {
  id: number; type: string; name: string; account_number?: string;
  currency: string; start_date?: string; end_date?: string;
  starting_balance?: string; ending_balance?: string;
  statement_name: string;
  statement_period_from: string;
  statement_period_to: string;
  unprocessed_transactions_count?: number;
  number_of_transactions?: number;
  source_name?: string;
  source_type?: string;
}

type TransactionStatus = 'unprocessed' | 'unreconciled' | 'matched' | 'reconciled' | 'error';
const transactionStatuses: TransactionStatus[] = ['unprocessed', 'unreconciled', 'matched', 'reconciled', 'error'];

interface Transaction {
  id: number;
  date: string;
  description?: string;
  currency: string;
  amount: string;
  status: TransactionStatus;
  contact_name?: string;
  contact_wyzio_id?: string;
  balance?: string;
  reconciled_wyzio_number?: string;
  matched_type?: string;
  matched_wyzio_id?: string;
  type?: string;
  source_currency?: string;
  source_currency_amount?: string;
}

// --- Clickable Statement Card ---
interface StatementSummaryCardProps {
  statement: Statement;
  isSelected: boolean;
  onSelect: (statementId: number) => void;
}
function StatementSummaryCard({ statement, isSelected, onSelect }: StatementSummaryCardProps) {
    const formatDateRange = (from: string, to: string, outputFormat: string = 'dd.MM.yyyy') => {
        try { 
            const fromDateValid = isValid(parseISO(from));
            const toDateValid = isValid(parseISO(to));
            if (fromDateValid && toDateValid) {
                return `${format(parseISO(from), outputFormat)} - ${format(parseISO(to), outputFormat)}`;
            }
        } catch {/* ignore */}
        const safeFrom = from || 'N/A';
        const safeTo = to || 'N/A';
        return `${safeFrom} - ${safeTo}`;
    };
    const unprocessedCount = statement.unprocessed_transactions_count ?? 'N/A';
    return (
        <Card
            className={cn("cursor-pointer hover:shadow-md transition-shadow h-full flex flex-col", isSelected && "ring-2 ring-primary shadow-md")}
            onClick={() => onSelect(statement.id)}
        >
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">{statement.statement_name || statement.name}</CardTitle>
                 {statement.source_name && statement.source_type && <CardDescription className="text-xs">{statement.source_name} ({statement.source_type})</CardDescription>}
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1 pt-0 flex-grow">
                <p>Period: {formatDateRange(statement.statement_period_from || statement.start_date || '', statement.statement_period_to || statement.end_date || '')}</p>
                <p>Currency: {statement.currency}</p>
                {typeof statement.number_of_transactions === 'number' && <p>Total: {statement.number_of_transactions}</p>}
                <p>Unprocessed: {unprocessedCount}</p>
            </CardContent>
        </Card>
    );
}

const formatDateRangeForTitle = (from: string, to: string, outputFormat: string = 'dd.MM.yyyy') => {
  try { 
      const fromDateValid = isValid(parseISO(from));
      const toDateValid = isValid(parseISO(to));
      if (fromDateValid && toDateValid) {
          return `${format(parseISO(from), outputFormat)} - ${format(parseISO(to), outputFormat)}`;
      }
  } catch {/* ignore */}
  const safeFrom = from || 'N/A';
  const safeTo = to || 'N/A';
  return `${safeFrom} - ${safeTo}`;
};

const parseStatementDate = (dateString: string | undefined): Date | undefined => {
  if (!dateString) return undefined;
  try {
    const date = parseISO(dateString);
    return isValid(date) ? date : undefined;
  } catch {
    return undefined;
  }
};

// --- Main Page Component ---
export default function TransactionsPage() {
  const { selectedOrg } = useAuth();
  const [statements, setStatements] = useState<Statement[]>([]);
  const [isLoadingStatements, setIsLoadingStatements] = useState(false);
  const [selectedStatementId, setSelectedStatementId] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

  // Page level filters state
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<TransactionStatus | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
  
  // --- Lifted Table State ---
  const [sorting, setSorting] = useState<SortingState>([{ id: "date", desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  // --- End Lifted Table State ---

  useEffect(() => {
    if (selectedOrg?.id) {
      setIsLoadingStatements(true); 
      setStatements([]); 
      setSelectedStatementId(null); 
      setTransactions([]); 
      setDateRange(undefined);
      setSelectedStatus('all');
      setSelectedCategory('all');
      setGlobalFilter('');
      const fetchStatements = async () => { 
        const apiUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/organizations/${selectedOrg.id}/statements`; 
        try { 
            const response = await fetch(apiUrl, { credentials: 'include' }); 
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`); 
            const data = await response.json(); 
            setStatements(Array.isArray(data) ? data : []); 
        } catch (error) { console.error("Error fetching statements:", error); setStatements([]); } 
        finally { setIsLoadingStatements(false); } 
      }; 
      fetchStatements(); 
    } else { 
      setStatements([]); 
      setSelectedStatementId(null); 
      setTransactions([]); 
      setIsLoadingStatements(false); 
    } 
  }, [selectedOrg]);

  useEffect(() => {
    if (selectedStatementId && selectedOrg?.id) {
      setIsLoadingTransactions(true); 
      setTransactions([]);
      const currentStatement = statements.find(s => s.id === selectedStatementId);
      const startDate = parseStatementDate(currentStatement?.statement_period_from || currentStatement?.start_date);
      const endDate = parseStatementDate(currentStatement?.statement_period_to || currentStatement?.end_date);
      
      if (startDate) {
        setDateRange({ from: startDate, to: endDate });
      } else {
        setDateRange(undefined);
      }
      
      setSelectedStatus('all');
      setSelectedCategory('all');
      setGlobalFilter('');

      const fetchTransactions = async () => {
        const apiUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/statements/${selectedStatementId}/transactions`; 
        try { 
            const response = await fetch(apiUrl, { credentials: 'include' }); 
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`); 
            const data = await response.json(); 
            setTransactions(Array.isArray(data) ? data : []); 
        } catch (error) { console.error("Error fetching transactions:", error); setTransactions([]);} 
        finally { setIsLoadingTransactions(false); } 
      }; 
      fetchTransactions(); 
    } else { 
      setTransactions([]); 
      setIsLoadingTransactions(false); 
    } 
  }, [selectedStatementId, selectedOrg?.id, statements]); 

  const selectedStatement = useMemo(() => statements.find(s => s.id === selectedStatementId) || null, [statements, selectedStatementId]);

  const uniqueCategories = useMemo(() => {
    const categories = new Set(transactions.map(t => t.type).filter((type): type is string => typeof type === 'string' && type.length > 0)); 
    return Array.from(categories).sort();
  }, [transactions]);

  const pageFilteredTransactions = useMemo(() => {
    let items = transactions;
    if (dateRange?.from) {
      const fromDate = startOfDay(dateRange.from);
      items = items.filter(t => {
        try { const transactionDate = parseISO(t.date); return isValid(transactionDate) && transactionDate >= fromDate; } catch { return false; }
      });
    }
    if (dateRange?.to) {
      const toDate = endOfDay(dateRange.to);
      items = items.filter(t => {
        try { const transactionDate = parseISO(t.date); return isValid(transactionDate) && transactionDate <= toDate; } catch { return false; }
      });
    }
    if (selectedStatus && selectedStatus !== 'all') {
      items = items.filter(t => t.status === selectedStatus);
    }
    if (selectedCategory && selectedCategory !== 'all') {
      items = items.filter(t => t.type === selectedCategory);
    }
    return items;
  }, [transactions, dateRange, selectedStatus, selectedCategory]);

  const columns = useMemo<ColumnDef<Transaction>[]>(() => [
    // ... column definitions ...
    {
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) => {
             const dateValue = row.getValue("date");
             if (typeof dateValue === 'string' && dateValue) {
                 try { const date = parseISO(dateValue); if (isValid(date)) return format(date, "dd.MM.yyyy"); } catch (e) { /* Log error? */ }
                 return dateValue;
             } return '-';
        },
        enableSorting: true,
    },
    {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => <div className="truncate" title={row.getValue("description")}>{row.getValue("description") || '-'}</div>,
        enableSorting: true,
    },
    {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => {
             const amountStr = row.getValue("amount") as string;
             const amount = parseFloat(amountStr);
             const formatted = new Intl.NumberFormat("en-US", { style: "decimal", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
             const isDebit = amount < 0;
             return <div className={cn("text-right font-medium", isDebit ? "text-destructive" : "text-green-600")}>{formatted}</div>;
        },
        enableSorting: true,
    },
     {
        accessorKey: "balance",
        header: "Balance",
        cell: ({ row }) => {
             const balanceStr = row.getValue("balance") as string | undefined;
             if (balanceStr && !isNaN(parseFloat(balanceStr))) {
                const balance = parseFloat(balanceStr);
                return <div className="text-right">{new Intl.NumberFormat("en-US", { style: "decimal", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(balance)}</div>;
             }
             return <div className="text-right">-</div>;
        },
        enableSorting: true,
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
             const status = row.getValue("status") as TransactionStatus;
             let variant: "default" | "secondary" | "outline" | "destructive" = "outline";
             if (status === 'reconciled') variant = 'default';
             else if (status === 'matched') variant = 'secondary';
             else if (status === 'error') variant = 'destructive';
             return <Badge variant={variant} className="text-xs capitalize">{status || '-'}</Badge>;
        },
        enableSorting: true,
    },
    {
        accessorKey: "type",
        header: "Category",
        cell: ({ row }) => <div className="truncate capitalize">{row.original.type || '-'}</div>,
        enableSorting: true,
    },
    {
        accessorKey: "contact_name",
        header: "Contact",
        cell: ({ row }) => <div className="truncate">{row.getValue("contact_name") || '-'}</div>,
        enableSorting: true,
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
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
      enableSorting: false,
      enableHiding: false,
    }
  ], [selectedStatement?.currency]);
  
  const table = useReactTable({
    data: pageFilteredTransactions, 
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
      rowSelection,
    },
  });

  const handleDateUpdate = ({ range }: { range: DateRange | undefined }) => {
    setDateRange(range);
  };

  if (!selectedOrg) return <div className="p-6 text-center text-muted-foreground">Please select an organization.</div>;

  return (
    // Added h-full back to root div
    <div className="flex flex-col h-full">
      <div className="flex flex-col xl:flex-row gap-4 mb-2">
        <div className="flex-1">
            {isLoadingStatements ? ( <div className="h-32 flex items-center justify-center text-muted-foreground rounded-lg border border-dashed">Loading statements...</div> )
             : statements.length > 0 ? ( <ScrollArea className="w-full whitespace-nowrap pb-4"> <div className="flex space-x-4"> {statements.map(stmt => ( <div key={stmt.id} className="min-w-[240px] max-w-xs flex-shrink-0 h-full"> <StatementSummaryCard statement={stmt} isSelected={selectedStatementId === stmt.id} onSelect={setSelectedStatementId} /> </div> ))} </div> <ScrollBar orientation="horizontal" /> </ScrollArea> )
             : ( <div className="h-32 flex items-center justify-center text-muted-foreground rounded-lg border border-dashed">No statements found.</div> )}
        </div>
      </div>

      {/* Combined Filters Section */}
      <div className="flex flex-wrap items-center gap-4 pb-4">
        <Input
            placeholder="Search transactions..."
            value={globalFilter ?? ''}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="max-w-xs h-9 text-sm"
        />
        <DateRangePicker
          key={selectedStatementId}
          initialDateFrom={dateRange?.from}
          initialDateTo={dateRange?.to}
          onUpdate={handleDateUpdate} 
          align="start"
          locale="en-GB" 
          showCompare={false}
        />
        <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as TransactionStatus | 'all')}>
          <SelectTrigger className="w-[160px] h-9 text-sm">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {transactionStatuses.map(status => (
              <SelectItem key={status} value={status} className="capitalize">
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as string | 'all')} >
          <SelectTrigger className="w-[160px] h-9 text-sm">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {uniqueCategories.map(category => (
              <SelectItem key={category} value={category} className="capitalize">
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => {
          setDateRange(undefined);
          setSelectedStatus('all'); 
          setSelectedCategory('all');
          setGlobalFilter('');
        }} className="h-9">Clear Filters</Button>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-9 ml-auto">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[150px]">
            {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                    {column.id}
                </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Transactions Table Section */}
      <div className="flex-1 flex flex-col min-h-0 border rounded-lg shadow-sm bg-card">
        <div className="flex-1 min-h-0">
          {isLoadingTransactions && !pageFilteredTransactions.length && !transactions.length ? (
            <div className="h-full flex items-center justify-center text-muted-foreground p-4">
              Loading transactions...
            </div>
          ) : !selectedStatementId && !transactions.length ? (
            <div className="h-full flex items-center justify-center text-muted-foreground p-4">
              Select a statement above to view transactions.
            </div>
          ) : (
            <DataTable table={table} columns={columns} />
          )}
        </div>

        <div className="flex items-center justify-end p-2 border-t">
             <span className="text-xs text-muted-foreground">
                 Displaying: {table.getFilteredRowModel().rows.length} / Filtered: {pageFilteredTransactions.length} / Total: {transactions.length} transaction(s)
            </span>
        </div>
      </div>
    </div>
  );
}
