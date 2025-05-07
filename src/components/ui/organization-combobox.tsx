'use client'

import * as React from "react"
import { Check, ChevronsUpDown, Building } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface Organization {
  id: number;
  name: string;
  wyzio_id?: string; 
}

interface OrganizationComboboxProps {
  organizations: Organization[];
  selectedOrg: Organization | null;
  setSelectedOrg: (org: Organization | null) => void;
  isCollapsed?: boolean; // For collapsed sidebar styling
}

export function OrganizationCombobox({ 
  organizations = [], // Default to empty array
  selectedOrg,
  setSelectedOrg,
  isCollapsed = false 
}: OrganizationComboboxProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full", isCollapsed ? "justify-center px-2" : "justify-between px-3")}
          aria-label={selectedOrg ? `Selected organization: ${selectedOrg.name}` : "Select organization"}
        >
          <div className="flex items-center gap-2 truncate">
            <Building className="h-4 w-4 flex-shrink-0" />
            {!isCollapsed && (
              <span className="truncate">
                {selectedOrg ? selectedOrg.name : "Select organization..."}
              </span>
            )}
          </div>
          {!isCollapsed && <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
        </Button>
      </PopoverTrigger>
      {/* Adjust width calculation if needed, using CSS var for trigger width */} 
      <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0" align={isCollapsed ? "start" : "center"}>
        <Command>
          <CommandInput placeholder="Search organization..." />
          <CommandList>
            <CommandEmpty>No organization found.</CommandEmpty>
            <CommandGroup>
              {organizations.map((org) => (
                <CommandItem
                  key={org.id}
                  value={org.name} // Use name for searching/selection value
                  onSelect={(currentValue) => {
                    // Find the org object matching the selected name
                    const newSelectedOrg = organizations.find(
                      // Ensure case-insensitive comparison
                      (o) => o.name.toLowerCase() === currentValue.toLowerCase()
                    ) || null;
                    setSelectedOrg(newSelectedOrg); 
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedOrg?.id === org.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {org.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
