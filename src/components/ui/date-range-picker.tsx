/* eslint-disable max-lines */
'use client'

import React, { type FC, useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'; 
import { Button } from '@/components/ui/button' 
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover' 
import { Calendar } from '@/components/ui/calendar' 
import { DateInput } from '@/components/ui/date-input' 
import { Label } from '@/components/ui/label' 
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select' 
import { Switch } from '@/components/ui/switch' 
import { CalendarIcon, ChevronUpIcon, ChevronDownIcon, CheckIcon } from '@radix-ui/react-icons'
import { cn } from '@/lib/utils'
import { DateRange } from 'react-day-picker' 


interface Preset {
  name: string
  label: string
}

const PRESETS: Preset[] = [
  { name: 'today', label: 'Today' },
  { name: 'yesterday', label: 'Yesterday' },
  { name: 'last7', label: 'Last 7 days' },
  { name: 'last14', label: 'Last 14 days' },
  { name: 'last30', label: 'Last 30 days' },
  { name: 'thisWeek', label: 'This Week' },
  { name: 'lastWeek', label: 'Last Week' },
  { name: 'thisMonth', label: 'This Month' },
  { name: 'lastMonth', label: 'Last Month' }
]

export interface DateRangePickerProps {
  onUpdate?: (values: { range: DateRange | undefined, rangeCompare?: DateRange }) => void
  initialDateFrom?: Date | string
  initialDateTo?: Date | string
  initialCompareFrom?: Date | string
  initialCompareTo?: Date | string
  align?: 'start' | 'center' | 'end'
  locale?: string
  showCompare?: boolean
}


const getDateAdjustedForTimezone = (dateInput: Date | string | undefined): Date | undefined => {
  if (!dateInput) return undefined;
  if (typeof dateInput === 'string') {
    let date = new Date(dateInput);
    if (!isNaN(date.getTime())) return date; 
    
    const parts = dateInput.split('-').map((part) => parseInt(part, 10))
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) { 
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return undefined;
  } else if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
    return dateInput;
  }
  return undefined;
}

const makeValidDateRange = (from: Date | undefined, to: Date | undefined): DateRange | undefined => {
  const validFrom = from instanceof Date && !isNaN(from.getTime()) ? from : undefined;
  const validTo = to instanceof Date && !isNaN(to.getTime()) ? to : undefined;

  if (validFrom) {
    if (validTo && validTo < validFrom) {
       return { from: validFrom, to: validFrom };
    }
    return { from: validFrom, to: validTo };
  }
  return undefined;
};


export const DateRangePicker: FC<DateRangePickerProps> & {
  filePath: string
} = ({
  initialDateFrom,
  initialDateTo,
  initialCompareFrom,
  initialCompareTo,
  onUpdate,
  align = 'end',
  locale = 'en-US',
  showCompare = true
}) => { 
  const [isOpen, setIsOpen] = useState(false)

  const [range, setRange] = useState<DateRange | undefined>(() => 
     makeValidDateRange(
       getDateAdjustedForTimezone(initialDateFrom),
       getDateAdjustedForTimezone(initialDateTo)
     )
  );
  const [rangeCompare, setRangeCompare] = useState<DateRange | undefined>(() => 
     makeValidDateRange(
        getDateAdjustedForTimezone(initialCompareFrom),
        getDateAdjustedForTimezone(initialCompareTo)
     )
  );

  useEffect(() => {
    setRange(
      makeValidDateRange(
        getDateAdjustedForTimezone(initialDateFrom),
        getDateAdjustedForTimezone(initialDateTo)
      )
    );
  }, [initialDateFrom, initialDateTo]);

  useEffect(() => {
    setRangeCompare(
      makeValidDateRange(
        getDateAdjustedForTimezone(initialCompareFrom),
        getDateAdjustedForTimezone(initialCompareTo)
      )
    );
  }, [initialCompareFrom, initialCompareTo]);


  const openedRangeRef = useRef<DateRange | undefined>();
  const openedRangeCompareRef = useRef<DateRange | undefined>();

  const [selectedPreset, setSelectedPreset] = useState<string | undefined>(undefined)

  const [isSmallScreen, setIsSmallScreen] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 960 : false
  )

  useEffect(() => {
    const handleResize = (): void => {
      setIsSmallScreen(window.innerWidth < 960)
    }
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const getPresetRange = (presetName: string): DateRange | undefined => {
    const preset = PRESETS.find(({ name }) => name === presetName)
    if (!preset) return undefined;
    
    let from = new Date();
    let to = new Date();

    switch (preset.name) {
      case 'today':
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break
      case 'yesterday':
        from.setDate(from.getDate() - 1);
        from.setHours(0, 0, 0, 0);
        to.setDate(to.getDate() - 1);
        to.setHours(23, 59, 59, 999);
        break
      case 'last7':
        from.setDate(from.getDate() - 6);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break
      case 'last14':
        from.setDate(from.getDate() - 13);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break
      case 'last30':
        from.setDate(from.getDate() - 29);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break
      case 'thisWeek': {
        const firstDayOfWeek = from.getDate() - from.getDay();
        from.setDate(firstDayOfWeek);
        from.setHours(0, 0, 0, 0);
        to = new Date(from);
        to.setDate(from.getDate() + 6);
        to.setHours(23, 59, 59, 999);
        break;
      }
      case 'lastWeek': {
        const firstDayOfLastWeek = from.getDate() - from.getDay() - 7;
        from.setDate(firstDayOfLastWeek);
        from.setHours(0, 0, 0, 0);
        to = new Date(from);
        to.setDate(from.getDate() + 6);
        to.setHours(23, 59, 59, 999);
        break;
      }
      case 'thisMonth':
        from = new Date(from.getFullYear(), from.getMonth(), 1);
        from.setHours(0, 0, 0, 0);
        to = new Date(to.getFullYear(), to.getMonth() + 1, 0);
        to.setHours(23, 59, 59, 999);
        break
      case 'lastMonth':
        from = new Date(from.getFullYear(), from.getMonth() - 1, 1);
        from.setHours(0, 0, 0, 0);
        to = new Date(to.getFullYear(), to.getMonth(), 0);
        to.setHours(23, 59, 59, 999);
        break
      default: 
        return undefined;
    }

    return makeValidDateRange(from, to);
  }

  const setPreset = (preset: string): void => {
    const newRange = getPresetRange(preset);
    setRange(newRange);
    // Added checks for newRange and newRange.from
    if (rangeCompare && newRange?.from) { 
      const compareFrom = new Date(
        newRange.from.getFullYear() - 1,
        newRange.from.getMonth(),
        newRange.from.getDate()
      );
      const compareTo = newRange.to
        ? new Date(
            newRange.to.getFullYear() - 1,
            newRange.to.getMonth(),
            newRange.to.getDate()
          )
        : new Date( // Fallback to compareFrom date if newRange.to is undefined
            compareFrom.getFullYear(), 
            compareFrom.getMonth(),
            compareFrom.getDate()
          ); 
      setRangeCompare(makeValidDateRange(compareFrom, compareTo));
    }
  }

  const checkPreset = (): void => {
    if (!range?.from) {
      setSelectedPreset(undefined);
      return;
    }
    for (const preset of PRESETS) {
      const presetRange = getPresetRange(preset.name);
      if (!presetRange?.from) continue; 
      
      const currentRangeFrom = new Date(range.from);
      const presetFrom = new Date(presetRange.from);
      currentRangeFrom.setHours(0, 0, 0, 0);
      presetFrom.setHours(0, 0, 0, 0);

      const currentRangeToDate = range.to ?? range.from;
      const presetToDate = presetRange.to ?? presetRange.from;
      
      const currentRangeTo = new Date(currentRangeToDate);
      const presetTo = new Date(presetToDate);
      currentRangeTo.setHours(0, 0, 0, 0);
      presetTo.setHours(0, 0, 0, 0);

      if (
        currentRangeFrom.getTime() === presetFrom.getTime() &&
        currentRangeTo.getTime() === presetTo.getTime()
      ) {
        setSelectedPreset(preset.name);
        return;
      }
    }
    setSelectedPreset(undefined);
  }

  const resetValues = (): void => {
     setRange(
      makeValidDateRange(
        getDateAdjustedForTimezone(initialDateFrom),
        getDateAdjustedForTimezone(initialDateTo)
      )
    );
    setRangeCompare(
      makeValidDateRange(
        getDateAdjustedForTimezone(initialCompareFrom),
        getDateAdjustedForTimezone(initialCompareTo)
      )
    );
  }

  useEffect(() => {
    checkPreset()
  }, [range])

  const PresetButton = ({
    preset,
    label,
    isSelected
  }: {
    preset: string
    label: string
    isSelected: boolean
  }): React.JSX.Element => (
    <Button
      className={cn(isSelected && 'pointer-events-none')}
      variant="ghost"
      onClick={() => {
        setPreset(preset)
      }}
    >
      <>
        <span className={cn('pr-2 opacity-0', isSelected && 'opacity-70')}>
          <CheckIcon width={18} height={18} />
        </span>
        {label}
      </>
    </Button>
  )

  const areRangesEqual = (a?: DateRange, b?: DateRange): boolean => {
    if (!a && !b) return true;
    if (!a || !b) return false;
    
    // Add checks for `from` validity
    const aFromTime = a.from && !isNaN(a.from.getTime()) ? a.from.getTime() : undefined;
    const bFromTime = b.from && !isNaN(b.from.getTime()) ? b.from.getTime() : undefined;
    const aToTime = a.to && !isNaN(a.to.getTime()) ? a.to.getTime() : undefined;
    const bToTime = b.to && !isNaN(b.to.getTime()) ? b.to.getTime() : undefined;

    if (aFromTime !== bFromTime) return false;
    return aToTime === bToTime;
  }

  useEffect(() => {
    if (isOpen) {
      openedRangeRef.current = range ? { ...range } : undefined;
      openedRangeCompareRef.current = rangeCompare ? { ...rangeCompare } : undefined;
    }
  }, [isOpen])

  const formatDisplayRange = (currentRange: DateRange | undefined): string => {
     if (!currentRange?.from) {
       return "Select Date Range";
     }
     // Ensure date is valid before formatting
     const validFromDate = currentRange.from instanceof Date && !isNaN(currentRange.from.getTime()) ? currentRange.from : undefined;
     if (!validFromDate) return "Select Date Range"; // Fallback if from date is invalid

     const formatStr = 'dd MMM yyyy';
     if (currentRange.to) {
        const toDate = currentRange.to instanceof Date && !isNaN(currentRange.to.getTime()) ? currentRange.to : undefined;
        if (toDate) {
           return `${format(validFromDate, formatStr)} - ${format(toDate, formatStr)}`;
        }
     } 
     return format(validFromDate, formatStr);
  };

  return (
    <Popover
      modal={true}
      open={isOpen}
      onOpenChange={(open: boolean) => {
        if (!open) {
          setRange(openedRangeRef.current);
          setRangeCompare(openedRangeCompareRef.current);
        }
        setIsOpen(open)
      }}
    >
      <PopoverTrigger asChild>
         <Button
            id="date-range-picker-trigger"
            variant={"outline"}
            size="sm"
            className={cn(
              "w-[280px] justify-start text-left font-normal h-9 text-sm",
              !range && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDisplayRange(range)}
          </Button>
      </PopoverTrigger>
      <PopoverContent align={align} className="w-auto">
        <div className="flex py-2">
          <div className="flex">
            <div className="flex flex-col">
              <div className="flex flex-col lg:flex-row gap-2 px-3 justify-end items-center lg:items-start pb-4 lg:pb-0">
                {showCompare && (
                  <div className="flex items-center space-x-2 pr-4 py-1">
                    <Switch
                      checked={Boolean(rangeCompare)}
                      onCheckedChange={(checked: boolean) => {
                        if (checked) {
                           const fromDate = range?.from || new Date();
                           const toDate = range?.to || fromDate;
                           setRangeCompare(makeValidDateRange(
                             new Date(fromDate.getFullYear() - 1, fromDate.getMonth(), fromDate.getDate()),
                             new Date(toDate.getFullYear() - 1, toDate.getMonth(), toDate.getDate())
                           ));
                        } else {
                          setRangeCompare(undefined)
                        }
                      }}
                      id="compare-mode"
                    />
                    <Label htmlFor="compare-mode">Compare</Label>
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <DateInput
                      value={range?.from}
                      onChange={(date) => {
                         const validDate = date instanceof Date && !isNaN(date.getTime()) ? date : undefined;
                         if (!validDate) return;
                         const currentTo = range?.to;
                         const toDate = currentTo == null || validDate > currentTo ? validDate : currentTo;
                         setRange(makeValidDateRange(validDate, toDate));
                      }}
                    />
                    <div className="py-1">-</div>
                    <DateInput
                      value={range?.to}
                      onChange={(date) => {
                         const validDate = date instanceof Date && !isNaN(date.getTime()) ? date : undefined;
                         if (!validDate) return;
                         const currentFrom = range?.from;
                         if (currentFrom && validDate < currentFrom) {
                             setRange(makeValidDateRange(validDate, validDate)); 
                         } else {
                             setRange(makeValidDateRange(currentFrom, validDate));
                         }
                      }}
                    />
                  </div>
                  {rangeCompare != null && (
                    <div className="flex gap-2">
                      <DateInput
                        value={rangeCompare?.from}
                        onChange={(date) => {
                          const validDate = date instanceof Date && !isNaN(date.getTime()) ? date : undefined;
                          if (!validDate) return;
                          const currentCompareTo = rangeCompare?.to;
                          const compareToDate = currentCompareTo == null || validDate > currentCompareTo ? validDate : currentCompareTo;
                          setRangeCompare(makeValidDateRange(validDate, compareToDate));
                        }}
                      />
                      <div className="py-1">-</div>
                      <DateInput
                        value={rangeCompare?.to}
                        onChange={(date) => {
                           const validDate = date instanceof Date && !isNaN(date.getTime()) ? date : undefined;
                           if (!validDate) return;
                           const currentCompareFrom = rangeCompare?.from;
                           if (currentCompareFrom && validDate < currentCompareFrom) {
                              setRangeCompare(makeValidDateRange(validDate, validDate));
                           } else {
                               setRangeCompare(makeValidDateRange(currentCompareFrom, validDate));
                           }
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
              { isSmallScreen && (
                <Select defaultValue={selectedPreset} onValueChange={(value) => { setPreset(value) }}>
                  <SelectTrigger className="w-[180px] mx-auto mb-2">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PRESETS.map((preset) => (
                      <SelectItem key={preset.name} value={preset.name}>
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <div>
                <Calendar
                  mode="range"
                  onSelect={(value: DateRange | undefined) => {
                    setRange(value ? makeValidDateRange(value.from, value.to) : undefined);
                  }}
                  selected={range}
                  numberOfMonths={isSmallScreen ? 1 : 2}
                  defaultMonth={range?.from ?? new Date()} // Fallback to current date
                  disabled={undefined} // Explicitly set disabled to undefined
                />
              </div>
            </div>
          </div>
          {!isSmallScreen && (
            <div className="flex flex-col items-end gap-1 pr-2 pl-6 pb-6">
              <div className="flex w-full flex-col items-end gap-1 pr-2 pl-6 pb-6">
                {PRESETS.map((preset) => (
                  <PresetButton
                    key={preset.name}
                    preset={preset.name}
                    label={preset.label}
                    isSelected={selectedPreset === preset.name}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 py-2 pr-4">
          <Button
            onClick={() => {
              setIsOpen(false)
              setRange(openedRangeRef.current);
              setRangeCompare(openedRangeCompareRef.current);
            }}
            variant="ghost"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              openedRangeRef.current = range; 
              openedRangeCompareRef.current = rangeCompare;
              setIsOpen(false)
              onUpdate?.({ range, rangeCompare })
            }}
          >
            Update
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

DateRangePicker.displayName = 'DateRangePicker'
DateRangePicker.filePath =
  'components/ui/date-range-picker.tsx'
