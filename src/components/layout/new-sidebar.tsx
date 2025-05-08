'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button'; 
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  Inbox,
  FolderKanban,
  ReceiptText,
  MessageSquareText,
  LifeBuoy,
  User as UserIcon, 
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  disabled?: boolean;
  external?: boolean; 
}

interface NavGroup {
  title?: string;
  items: NavItem[];
  isBottom?: boolean; 
}

const navigationConfig: NavGroup[] = [
  { items: [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
  { items: [{ href: '/inbox', label: 'Inbox', icon: Inbox }] },
  {
    title: 'Knowledge',
    items: [
      { href: '/transactions', label: 'Transactions', icon: ReceiptText },
      { href: '/documents', label: 'Documents', icon: FolderKanban },
    ],
  },
  {
    title: 'Tasks',
    items: [
      { href: '/communications', label: 'Communications', icon: MessageSquareText },
      { href: '/support', label: 'Support', icon: LifeBuoy },
    ],
  },
];

interface NewSidebarProps {
  isMobile?: boolean; 
  isDesktopCollapsed: boolean;
  setIsDesktopCollapsed: (isCollapsed: boolean) => void; 
  className?: string;
}

export function NewSidebar({
  isMobile = false,
  isDesktopCollapsed,
  setIsDesktopCollapsed, 
  className,
}: NewSidebarProps) {
  const pathname = usePathname();
  const isEffectivelyCollapsed = !isMobile && isDesktopCollapsed;

  const allTopNavItems = navigationConfig
    .filter(group => !group.isBottom)
    .flatMap(group => group.items);
  
  const bottomNavItems: NavItem[] = [];

  const NavLink = ({ item }: { item: NavItem }) => {
    const handleLinkClick = () => {
      if (!isMobile && !isDesktopCollapsed) { 
        setIsDesktopCollapsed(true);
      }
    };
    
    const linkContent = (
      <Link
        href={item.href}
        onClick={handleLinkClick}
        className={cn(
          buttonVariants({ variant: pathname.startsWith(item.href) ? 'default' : 'ghost', size: 'default' }),
          'w-full justify-start gap-2 h-10',
          isEffectivelyCollapsed && 'justify-center px-0',
          pathname.startsWith(item.href) && 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground',
          !pathname.startsWith(item.href) && 'hover:bg-muted hover:text-foreground',
        )}
        target={item.external ? '_blank' : undefined}
        rel={item.external ? 'noopener noreferrer' : undefined}
        title={item.label}
      >
        <item.icon className={cn('h-5 w-5', isEffectivelyCollapsed ? 'mx-auto' : '')} />
        {!isEffectivelyCollapsed && <span className="text-sm truncate">{item.label}</span>}
      </Link>
    );

    if (isEffectivelyCollapsed) {
      return (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
            <TooltipContent side="right" sideOffset={5}>
              <p>{item.label}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return linkContent;
  };

  return (
    <div
      className={cn(
        'flex h-full flex-col border-r bg-background dark:bg-neutral-900',
        isMobile ? 'w-full' : isDesktopCollapsed ? 'w-20' : 'w-60',
        'transition-all duration-300 ease-in-out',
        className
      )}
    >
      <div
        className={cn(
          'flex h-16 items-center border-b px-4 shrink-0',
          isEffectivelyCollapsed ? 'justify-center' : 'justify-start' 
        )}
      >
        <Link
            href="/dashboard"
            className={cn("flex items-center gap-2 font-semibold", isEffectivelyCollapsed && !isMobile ? "justify-center w-full" : "")}
            title="Dashboard"
        >
            <Image
                src="/ll_logo.png"
                alt="LedgerLink Logo"
                width={isEffectivelyCollapsed && !isMobile ? 32 : 30} 
                height={isEffectivelyCollapsed && !isMobile ? 32 : 30}
                priority
            />
            {(!isEffectivelyCollapsed || isMobile) && (
                 <span className="font-bold text-lg">LedgerLink</span>
            )}
        </Link>
      </div>

      <ScrollArea className="flex-grow">
        <nav className={cn('grid gap-1 p-3', isEffectivelyCollapsed ? 'px-2' : '')}>
          {allTopNavItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>
      </ScrollArea>

      {bottomNavItems.length > 0 && (
        <div className={cn('mt-auto border-t p-3 shrink-0', isEffectivelyCollapsed ? 'px-2' : '')}>
            <div className="grid gap-1">
                {bottomNavItems.map((item) => (
                    <NavLink key={item.href} item={item} />
                ))}
            </div>
        </div>
      )}
    </div>
  );
}
