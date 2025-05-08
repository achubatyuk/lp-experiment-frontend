'use client';

import React from 'react'; // Keep explicit import just in case
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { cn } from '@/lib/utils';

// TODO: Centralize this navigation configuration
const tempNavigationConfig = [
  { items: [{ href: '/dashboard', label: 'Dashboard', icon: () => null }] }, 
  { items: [{ href: '/inbox', label: 'Inbox', icon: () => null }] },
  { title: 'Knowledge', items: [ { href: '/transactions', label: 'Transactions', icon: () => null }, { href: '/documents', label: 'Documents', icon: () => null }, ], },
  { title: 'Tasks', items: [ { href: '/communications', label: 'Communications', icon: () => null }, { href: '/support', label: 'Support', icon: () => null }, ], },
  { items: [{ href: '/profile', label: 'Profile', icon: () => null }] }
];

const getPageLabelByHref = (href: string): string | undefined => {
  for (const group of tempNavigationConfig) { for (const item of group.items) { if (item.href === href || href.startsWith(item.href + '/')) { return item.label; } } }
  for (const group of tempNavigationConfig) { if (!group.title) { const item = group.items.find(i => i.href === href || href.startsWith(i.href + '/')); if (item) return item.label; } }
  return undefined;
};

export function AppBreadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(segment => segment); 

  // Use React.ReactNode[] instead of JSX.Element[]
  let breadcrumbItems: React.ReactNode[] = []; 

  if (segments.length === 0) {
    const dashboardLabel = getPageLabelByHref('/dashboard') || "Dashboard";
    breadcrumbItems.push(
      <BreadcrumbItem key="/dashboard">
        <BreadcrumbPage className="truncate max-w-xs md:max-w-sm text-foreground">
          {dashboardLabel}
        </BreadcrumbPage>
      </BreadcrumbItem>
    );
  } else {
    breadcrumbItems = segments.map((segment, index) => {
      const href = `/${segments.slice(0, index + 1).join('/')}`;
      let label = getPageLabelByHref(href);
      if (!label) { label = segment.charAt(0).toUpperCase() + segment.slice(1); }
      const isLast = index === segments.length - 1;

      return (
        // React.Fragment requires React to be in scope
        <React.Fragment key={href}>
          <BreadcrumbItem>
            {isLast ? (
              <BreadcrumbPage className="truncate max-w-xs md:max-w-sm text-foreground">
                {label}
              </BreadcrumbPage>
            ) : (
              <BreadcrumbLink asChild className="truncate max-w-xs md:max-w-sm">
                <Link href={href}>{label}</Link>
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>
          {!isLast && <BreadcrumbSeparator />}
        </React.Fragment>
      );
    });
  }

  return (
    <Breadcrumb className={cn("hidden md:block", className)}>
      <BreadcrumbList>{breadcrumbItems}</BreadcrumbList>
    </Breadcrumb>
  );
}
