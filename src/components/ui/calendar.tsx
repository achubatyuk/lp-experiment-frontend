'use client';

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({ 
  className, 
  classNames, 
  showOutsideDays = true,
  // captionLayout = "buttons", // Set default caption layout if desired
  ...props 
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      // captionLayout={captionLayout} // Pass captionLayout
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        // Modified caption for better nav button placement
        caption: "flex justify-between px-1 items-center relative", // Use justify-between 
        caption_label: "text-sm font-medium",
        nav: "flex items-center gap-1", // Added gap
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        // Removed absolute positioning
        nav_button_previous: "", 
        nav_button_next: "",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]", // Keep w-8
        row: "flex w-full mt-2",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md"
            : "[&:has([aria-selected])]:rounded-md"
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-8 w-8 p-0 font-normal aria-selected:opacity-100" // Ensure size-8 matches head_cell w-8
        ),
        day_range_start: 
          "day-range-start aria-selected:bg-primary aria-selected:text-primary-foreground rounded-l-md",
        day_range_end: 
          "day-range-end aria-selected:bg-primary aria-selected:text-primary-foreground rounded-r-md",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-md",
        day_today: "bg-accent text-accent-foreground",
        day_outside: "day-outside text-muted-foreground opacity-50",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="size-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="size-4" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
