'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  LayoutDashboard, Inbox, FolderKanban, ReceiptText, MessageSquareText, 
  LogOut, Menu, User as UserIcon, LifeBuoy, Settings, PanelLeftClose, PanelLeftOpen,
  Sun, Moon, Laptop, MoreHorizontal 
} from 'lucide-react';
import Image from 'next/image';
import { useAuth } from "@/context/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from 'next-themes';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  disabled?: boolean;
}

interface NavGroup {
  title?: string; 
  items: NavItem[];
}

const navigationConfig: NavGroup[] = [
  { items: [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
  { items: [{ href: '/inbox', label: 'Inbox', icon: Inbox }] },
  {
    title: 'Knowledge',
    items: [
      { href: '/transactions', label: 'Transactions', icon: ReceiptText },
      { href: '/documents', label: 'Documents', icon: FolderKanban },
    ]
  },
  {
    title: 'Tasks',
    items: [
      { href: '/communications', label: 'Communications', icon: MessageSquareText },
      { href: '/support', label: 'Support', icon: LifeBuoy },
    ]
  }
];

const profileNavItem = { href: '/profile', label: 'Profile', icon: UserIcon };

interface Organization { 
  id: number;
  name: string;
  wyzio_id?: string;
}

interface SidebarProps {
  isMobile?: boolean;
  isDesktopCollapsed: boolean;
  setIsDesktopCollapsed: (isCollapsed: boolean) => void;
}

function Sidebar({ 
  isMobile = false, 
  isDesktopCollapsed,
  setIsDesktopCollapsed 
}: SidebarProps) {
  const pathname = usePathname();
  const isEffectivelyCollapsed = !isMobile && isDesktopCollapsed;

  const NavLink = ({ href, icon: Icon, label }: NavItem ) => {
    const linkContent = (
      <Link href={href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
          pathname.startsWith(href) && "bg-muted text-primary",
          isEffectivelyCollapsed && "justify-center"
        )}
      >
        <Icon className="h-5 w-5" /> 
        {!isEffectivelyCollapsed && <span className="text-sm">{label}</span>}
      </Link>
    );

    if (isEffectivelyCollapsed) {
      return (
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
            <TooltipContent side="right" sideOffset={5}>
              <p>{label}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return linkContent;
  };

  return (
    <div className={cn("flex h-full flex-col bg-muted/40 border-r", isMobile ? "w-full" : "")}>
      {/* Sidebar Header with Logo and Toggle Button */}
      <div className={cn("flex h-16 items-center border-b px-4", 
                      isEffectivelyCollapsed ? "justify-center" : "justify-between")}>
        <Link href="/dashboard" className={cn("flex items-center gap-2 font-semibold", isEffectivelyCollapsed ? "" : "mr-2")} title="Dashboard">
          <Image 
            src="/ll_logo.png" // Use ll_logo.png
            alt="LedgerLink Logo"
            width={30} 
            height={30}
            priority 
          />
          {/* LedgerLink text is removed */}
        </Link>
        {!isMobile && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
            className="transition-transform duration-300 ease-in-out" // Added transition for icon rotation
            title={isDesktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isDesktopCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            <span className="sr-only">Toggle sidebar</span>
          </Button>
        )}
      </div>
      
      {/* Organization Combobox REMOVED from Sidebar */}

      <ScrollArea className="flex-1">
        <nav className={cn("grid gap-1 p-3", isEffectivelyCollapsed ? "px-1.5" : "")}>
          {navigationConfig.map((group, groupIndex) => (
            <div key={group.title || `group-${groupIndex}`}>
              {group.title && (
                 isEffectivelyCollapsed ? (
                    <TooltipProvider delayDuration={100}>
                        <Tooltip>
                            <TooltipTrigger className="flex justify-center items-center w-full my-2 h-8"> 
                                <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent side="right" sideOffset={5}><p>{group.title}</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                 ) : (
                    <h2 className="my-2 px-3 text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                        {group.title}
                    </h2>
                 )
              )}
              {group.items.map((item) => <NavLink key={item.href} {...item} />)}
              {group.title && groupIndex < navigationConfig.length - 1 && !isEffectivelyCollapsed && (
                <hr className="my-2 border-border/60" />
              )}
            </div>
          ))}
        </nav>
      </ScrollArea>
      <div className={cn("mt-auto border-t p-3", isEffectivelyCollapsed ? "px-1.5" : "")}>
        {/* Footer is empty */}
      </div>
    </div>
  );
}

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter(); 
  const { user, organizations, selectedOrg, setSelectedOrg, isAuthenticated, isLoading } = useAuth(); 
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { setTheme } = useTheme(); 
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(true); 

  const allPageNavItems = navigationConfig.flatMap(group => group.items); 
  const currentPage = [...allPageNavItems, profileNavItem].find((item) => pathname.startsWith(item.href));
  const currentPageLabel = currentPage ? currentPage.label : "Page"; 

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleLogout = () => {
    const backendLogoutUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/logout`;
    window.location.href = backendLogoutUrl;
  };

  if (isLoading || !isAuthenticated) {
     return <div className="min-h-screen flex items-center justify-center">Loading authentication...</div>; 
  }
  
  const sidebarWidth = isDesktopSidebarCollapsed ? "sm:w-20" : "sm:w-60"; 
  const contentPadding = isDesktopSidebarCollapsed ? "sm:pl-20" : "sm:pl-60";

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/10">
      <aside className={cn("fixed inset-y-0 left-0 z-10 hidden flex-col border-r bg-background sm:flex transition-all duration-300 ease-in-out", sidebarWidth)}>
         <Sidebar 
            isMobile={false} 
            isDesktopCollapsed={isDesktopSidebarCollapsed} 
            setIsDesktopCollapsed={setIsDesktopSidebarCollapsed} 
         />
      </aside>
      
      <div className={cn("flex flex-col sm:gap-4 sm:py-4 transition-all duration-300 ease-in-out", contentPadding)}>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="sm:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs p-0 w-[280px]">
              <Sidebar 
                isMobile={true} 
                isDesktopCollapsed={isDesktopSidebarCollapsed} 
                setIsDesktopCollapsed={setIsDesktopSidebarCollapsed}
              />
            </SheetContent>
          </Sheet>
          
          <div className="w-full flex-1">
            <h1 className="font-semibold text-lg">{currentPageLabel}</h1>
          </div>

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
        
        <main className="flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 bg-muted/10">
          {children}
        </main>
      </div>
    </div>
  );
}
