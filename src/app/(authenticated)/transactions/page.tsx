'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react'; 
import { 
  ResizableHandle, 
  ResizablePanel, 
  ResizablePanelGroup 
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area"; 
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; 
import { Calendar } from "@/components/ui/calendar"; 
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"; 
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; 
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel, 
  SortingState, 
  useReactTable,
  ColumnFiltersState, 
} from "@tanstack/react-table";
import { MoreHorizontal, ArrowUpDown, Eye, Glasses, Trash2, Link2, CalendarIcon } from "lucide-react"; 
import { format, isValid, parseISO } from "date-fns"; 
import { DateRange } from "react-day-picker"; 

// Interfaces (can be moved)
interface Statement {
  id: number; type: string; name: string; account_number?: string;
  currency: string; start_date?: string; end_date?: string;
  starting_balance?: string; ending_balance?: string;
}

interface Transaction {
  id: number; date: string; 
  description?: string; currency: string;
  amount: string; status: string; contact_name?: string; contact_wyzio_id?: string;
  balance?: string; reconciled_wyzio_number?: string; matched_type?: string;
  matched_wyzio_id?: string; type?: string; 
  source_currency?: string; source_currency_amount?: string;
}

const IndeterminateCheckbox = React.forwardRef<
    HTMLInputElement,
    { indeterminate?: boolean; className?: string; [key: string]: any }
>(({ indeterminate, className = '', ...rest }, ref) => {
    const defaultRef = useRef<HTMLInputElement>(null);
    const resolvedRef = ref || defaultRef;
    useEffect(() => {
        if (typeof resolvedRef === 'object' && resolvedRef.current) {
            resolvedRef.current.indeterminate = !!indeterminate;
        }
    }, [resolvedRef, indeterminate]);
    return <input type="checkbox" ref={resolvedRef} className={className + ' cursor-pointer'} {...rest} />;
});
IndeterminateCheckbox.displayName = 'IndeterminateCheckbox';

export default function TransactionsPage() {
  const { selectedOrg } = useAuth(); 
  const [statements, setStatements] = useState<Statement[]>([]);
  const [selectedStatement, setSelectedStatement] = useState<Statement | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingStatements, setIsLoadingStatements] = useState(false);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

  const [sorting, setSorting] = useState<SortingState>([{ id: 'date', desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined); 

  // Update table filter when dateRange changes
  useEffect(() => {
    const dateFilter = columnFilters.find(f => f.id === 'date');
    if (dateRange?.from || dateRange?.to) {
      const newDateFilterValue = [dateRange.from, dateRange.to];
      if (dateFilter) {
        setColumnFilters(prev => prev.map(f => f.id === 'date' ? { ...f, value: newDateFilterValue } : f));
      } else {
        setColumnFilters(prev => [...prev, { id: 'date', value: newDateFilterValue }]);
      }
    } else {
      // If dateRange is cleared, remove the date filter
      setColumnFilters(prev => prev.filter(f => f.id !== 'date')); // Corrected: Added closing quote
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [dateRange]); // Removed columnFilters from deps for now to avoid potential loops, will monitor

  useEffect(() => {
    if (selectedOrg?.id) { 
      setIsLoadingStatements(true); setStatements([]); setSelectedStatement(null); setTransactions([]); 
      const fetchStatements = async () => {
        const apiUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/organizations/${selectedOrg.id}/statements`; 
        try {
          const response = await fetch(apiUrl, { credentials: 'include' });
          if (!response.ok) throw new Error('Failed to fetch statements');
          const data = await response.json();
          setStatements(data);
          if (data.length > 0) setSelectedStatement(data[0]); 
        } catch (error) { console.error("Error fetching statements:", error); }
        finally { setIsLoadingStatements(false); }
      };
      fetchStatements();
    } else { setStatements([]); setSelectedStatement(null); setTransactions([]); }
  }, [selectedOrg]);

  useEffect(() => {
    if (selectedStatement?.id) {
      setIsLoadingTransactions(true); setTransactions([]); 
      const fetchTransactions = async () => {
        const apiUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/statements/${selectedStatement.id}/transactions`; 
        try {
          const response = await fetch(apiUrl, { credentials: 'include' });
          if (!response.ok) throw new Error('Failed to fetch transactions');
          const data = await response.json();
          setTransactions(data);
        } catch (error) { console.error("Error fetching transactions:", error); }
        finally { setIsLoadingTransactions(false); }
      };
      fetchTransactions();
    } else { setTransactions([]); }
  }, [selectedStatement]);

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString); 
      if (!isValid(date)) return dateString; 
      return format(date, "P"); 
    } catch { return dateString; }
  };

  const formatNumber = (numStr: string | undefined | null) => {
    if (numStr === null || numStr === undefined) return '-';
    const num = parseFloat(numStr);
    if (isNaN(num)) return numStr; 
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getStatusBadgeInfo = (status: string): { text: string; className: string } => {
    const s = status?.toLowerCase();
    if (s === 'reconciled') return { text: 'Booked', className: "bg-emerald-100 text-emerald-700 border-emerald-300" };
    if (s === 'matched') return { text: 'Review', className: "bg-orange-100 text-orange-700 border-orange-300" };
    if (s === 'unreconciled') return { text: 'Missing', className: "bg-gray-200 text-gray-700 border-gray-400" };
    if (s === 'error') return { text: 'Error', className: "bg-red-100 text-red-700 border-red-300" };
    if (s === 'unprocessed') return { text: 'Unprocessed', className: "bg-slate-100 text-slate-700 border-slate-300" };
    return { text: status || 'N/A', className: "bg-gray-100 text-gray-600 border-gray-300" };
  };

  const columns = useMemo<ColumnDef<Transaction>[]>(() => [
    {
      id: 'select',
      header: ({ table }) => (<IndeterminateCheckbox {...{ checked: table.getIsAllRowsSelected(), indeterminate: table.getIsSomeRowsSelected(), onChange: table.getToggleAllRowsSelectedHandler()}}/>),
      cell: ({ row }) => (<IndeterminateCheckbox {...{ checked: row.getIsSelected(), disabled: !row.getCanSelect(), indeterminate: row.getIsSomeSelected(), onChange: row.getToggleSelectedHandler()}}/>),
      size: 40, enableSorting: false,
    },
    {
      accessorKey: "status",
      header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="px-2">Status <ArrowUpDown className="ml-2 h-4 w-4" /></Button>,
      cell: ({ row }) => { const statusInfo = getStatusBadgeInfo(row.getValue("status")); return <Badge className={cn("border font-semibold", statusInfo.className)}>{statusInfo.text}</Badge>; },
      size: 120,
    },
    {
      accessorKey: "date",
      header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="px-2">Date <ArrowUpDown className="ml-2 h-4 w-4" /></Button>,
      cell: ({ row }) => formatDate(row.getValue("date")),
      size: 100,
      filterFn: (row, columnId, filterValue) => {
        const dateString = row.getValue(columnId) as string;
        const date = parseISO(dateString);
        if (!isValid(date)) return false;
        const [from, to] = filterValue as [Date | undefined, Date | undefined];
        if (from && date < from) return false;
        if (to && date > new Date(to.setHours(23, 59, 59, 999))) return false; 
        return true;
      },
    },
    { accessorKey: "contact_name", header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="px-2">Contact <ArrowUpDown className="ml-2 h-4 w-4" /></Button>, cell: ({ row }) => row.getValue("contact_name") || '-', size: 150, },
    { accessorKey: "type", header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="px-2">Type <ArrowUpDown className="ml-2 h-4 w-4" /></Button>, cell: ({ row }) => row.getValue("type") || '-', size: 100, },
    { accessorKey: "description", header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="px-2">Description <ArrowUpDown className="ml-2 h-4 w-4" /></Button>, cell: ({ row }) => <div className="truncate max-w-[200px]">{row.getValue("description") || '-'}</div>, },
    { accessorKey: "amount", header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="w-full justify-end px-2">Amount <ArrowUpDown className="ml-2 h-4 w-4" /></Button>, cell: ({ row }) => <div className="text-right font-mono tabular-nums">{formatNumber(row.getValue("amount"))}</div>, size: 120, },
    { accessorKey: "balance", header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="w-full justify-end px-2">Balance <ArrowUpDown className="ml-2 h-4 w-4" /></Button>, cell: ({ row }) => <div className="text-right font-mono tabular-nums">{formatNumber(row.getValue("balance"))}</div>, size: 120, },
    {
        id: 'actions',
        header: () => null,
        cell: ({ row }) => { 
            const transaction = row.original;
            const status = transaction.status?.toLowerCase();
            const statementType = selectedStatement?.type?.toLowerCase(); 
            return (
                <div className="flex items-center justify-end gap-1">
                    {status === 'review' && (<Button variant="ghost" size="icon" title="Review Match" onClick={() => console.log('Review:', transaction.id)}><Glasses className="h-4 w-4 text-orange-600" /></Button>)}
                    {status === 'booked' && (<Button variant="ghost" size="icon" title="View Details" onClick={() => console.log('View:', transaction.id)}><Eye className="h-4 w-4 text-emerald-600" /></Button>)}
                    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" title="More actions"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuLabel>Actions</DropdownMenuLabel><DropdownMenuSeparator />{status === 'review' && (<DropdownMenuItem onClick={() => console.log('Review (from menu):', transaction.id)}><Glasses className="mr-2 h-4 w-4" /> Review Match</DropdownMenuItem>)}{status === 'missing' && (<DropdownMenuItem onClick={() => console.log('Match (from menu):', transaction.id)}><Link2 className="mr-2 h-4 w-4" /> Match Transaction</DropdownMenuItem>)}{statementType === 'cash' && (<DropdownMenuItem onClick={() => console.log('Delete (from menu):', transaction.id)} className="text-red-600 hover:!text-red-600"><Trash2 className="mr-2 h-4 w-4" /> Delete (Cash)</DropdownMenuItem>)}<DropdownMenuItem onClick={() => console.log('Download Attachment (from menu):', transaction.id)}>Attachment (TBD)</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
                </div>
            );
        },
        size: 80, enableSorting: false,
    }
  ], [selectedStatement]);

  const table = useReactTable({
    data: transactions,
    columns,
    state: { sorting, columnFilters, rowSelection, },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(), 
    enableRowSelection: true, 
    defaultColumn: { size: 150, },
  });

  return (
    <ResizablePanelGroup 
      direction="horizontal"
      className="h-full max-h-[calc(100vh-var(--header-height)-3rem)] rounded-lg border bg-background"
    >
      <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
        <div className="flex flex-col h-full p-4">
          <h2 className="text-lg font-semibold mb-4">Statements</h2>
          {!selectedOrg ? (<p className="text-sm text-muted-foreground">Select an organization.</p>) 
          : isLoadingStatements ? (<p>Loading statements...</p>) 
          : statements.length === 0 ? (<p className="text-sm text-muted-foreground">No statements found.</p>) 
          : (<ScrollArea className="flex-1"><div className="space-y-2">
                {statements.map((stmt) => (
                  <Button key={stmt.id} variant={selectedStatement?.id === stmt.id ? "secondary" : "ghost"}
                    className="w-full justify-start h-auto py-2 px-3 text-left flex flex-col items-start"
                    onClick={() => setSelectedStatement(stmt)}>
                    <span className="font-medium truncate">{stmt.name}</span>
                    <span className="text-xs text-muted-foreground">{stmt.account_number || 'N/A'} - {stmt.currency}</span>
                     <span className="text-xs text-muted-foreground">
                       {stmt.start_date ? formatDate(stmt.start_date) : 'N/A'} - {stmt.end_date ? formatDate(stmt.end_date) : 'N/A'}
                     </span>
                  </Button>))}
              </div></ScrollArea>)}
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={75}>
         <div className="flex flex-col h-full">
            {/* Filters Area */}
            <div className="flex items-center gap-2 p-4 border-b">
                <Input 
                    placeholder="Search description/contact..."
                    value={(table.getColumn('description')?.getFilterValue() as string) ?? ''}
                    onChange={(event) => {
                        table.getColumn('description')?.setFilterValue(event.target.value)
                    }}
                    className="max-w-xs h-10"
                />
                {/* Date Range Picker */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={"outline"}
                            className={cn(
                                "w-[260px] justify-start text-left font-normal h-10",
                                !dateRange && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange?.from ? (
                                dateRange.to ? (
                                    <>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</>
                                ) : (
                                    format(dateRange.from, "LLL dd, y")
                                )
                            ) : (
                                <span>Pick a date range</span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={dateRange?.from}
                            selected={dateRange}
                            onSelect={setDateRange}
                            numberOfMonths={2}
                        />
                    </PopoverContent>
                </Popover>
                {(dateRange?.from || dateRange?.to) && (
                    <Button variant="ghost" onClick={() => setDateRange(undefined)} className="h-10">Clear</Button>
                )}
            </div>

           {/* Table Area */}
           <div className="flex-1 overflow-auto p-4">
             {!selectedStatement ? (<p className="text-sm text-muted-foreground">Select a statement.</p>) 
              : isLoadingTransactions ? (<p>Loading transactions...</p>) 
              : transactions.length === 0 ? (<p className="text-sm text-muted-foreground">No transactions found.</p>) 
              : (
                <div className="rounded-md border">
                  <Table>
                      <TableHeader>
                        {table.getHeaderGroups().map(headerGroup => (
                          <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map(header => (
                              <TableHead key={header.id} style={{ width: `${header.getSize()}px` }}>
                                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                              </TableHead>
                            ))}
                          </TableRow>
                        ))}
                      </TableHeader>
                      <TableBody>
                        {table.getRowModel().rows?.length ? (
                          table.getRowModel().rows.map(row => (
                            <TableRow key={row.id} data-state={row.getIsSelected() && "selected"} onClick={() => console.log("Row clicked:", row.original.id)} className="cursor-pointer">
                              {row.getVisibleCells().map(cell => (
                                <TableCell key={cell.id} style={{ width: `${cell.column.getSize()}px` }}>
                                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))
                        ) : (
                          <TableRow><TableCell colSpan={columns.length} className="h-24 text-center">No results.</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                </div>
              )}
           </div>
         </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
