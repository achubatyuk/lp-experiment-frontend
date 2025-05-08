'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { OrganizationCombobox } from "@/components/ui/organization-combobox"; 
import { cn } from "@/lib/utils";
import { 
  LogOut, 
  Menu, 
  User as UserIcon, 
  Sun, 
  Moon, 
  Laptop,
  PanelLeftOpen, 
  PanelLeftClose 
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { AppBreadcrumbs } from '@/components/layout/breadcrumbs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { NewSidebar } from '@/components/layout/new-sidebar';
import { Organization, User } from "@/context/AuthContext";

interface AppHeaderProps {
  user: User | null;
  organizations: Organization[];
  selectedOrg: Organization | null;
  setSelectedOrg: (org: Organization | null) => void;
  isAuthenticated: boolean;
  isSheetOpen: boolean;
  setIsSheetOpen: (isOpen: boolean) => void;
  isDesktopSidebarCollapsed: boolean;
  setIsDesktopSidebarCollapsed: (isCollapsed: boolean) => void;
  handleLogout: () => void;
}

export function AppHeader({
  user,
  organizations,
  selectedOrg,
  setSelectedOrg,
  isAuthenticated,
  isSheetOpen,
  setIsSheetOpen,
  isDesktopSidebarCollapsed,
  setIsDesktopSidebarCollapsed,
  handleLogout,
}: AppHeaderProps) {
  const { setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b bg-background px-4">
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs p-0 w-[280px]">
          <NewSidebar 
            isMobile={true} 
            isDesktopCollapsed={isDesktopSidebarCollapsed} 
            setIsDesktopCollapsed={setIsDesktopSidebarCollapsed} 
          />
        </SheetContent>
      </Sheet>

      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed)}
              className="hidden sm:inline-flex" 
              title={isDesktopSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isDesktopSidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />} 
              <span className="sr-only">Toggle sidebar</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{isDesktopSidebarCollapsed ? 'Expand' : 'Collapse'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <AppBreadcrumbs className="flex-1 min-w-0 ml-2" />

      <div className="flex items-center gap-3 ml-auto">
         {isAuthenticated && organizations && organizations.length > 0 && (
            <div className="w-auto min-w-[200px]"> 
                <OrganizationCombobox
                    organizations={organizations}
                    selectedOrg={selectedOrg} 
                    setSelectedOrg={setSelectedOrg} 
                    isCollapsed={false} 
                />
            </div>
         )}
         {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.picture} alt={user.name || 'U'} />
                    <AvatarFallback>{user.name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                   <Link href="/profile">
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                   </Link>
                </DropdownMenuItem>
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        <Sun className="mr-2 h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute mr-2 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        <span>Toggle theme</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                            <DropdownMenuItem onClick={() => setTheme("light")}>
                                <Sun className="mr-2 h-4 w-4" /> Light
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTheme("dark")}>
                                <Moon className="mr-2 h-4 w-4" /> Dark
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTheme("system")}>
                                <Laptop className="mr-2 h-4 w-4" /> System
                            </DropdownMenuItem>
                        </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                   <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
         )}
      </div>
    </header>
  );
}
