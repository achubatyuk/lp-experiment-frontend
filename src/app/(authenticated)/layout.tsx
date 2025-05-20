'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";
import { useAuth, Organization, User } from "@/context/AuthContext"; 
import { NewSidebar } from '@/components/layout/new-sidebar'; 
import { AppHeader } from '@/components/layout/app-header';

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter(); 
  const { user, organizations, selectedOrg, setSelectedOrg, isAuthenticated, isLoading, checkAuthStatus } = useAuth(); 
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(true); 

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
  
  const contentPaddingClass = isDesktopSidebarCollapsed ? "sm:pl-20" : "sm:pl-60";

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/10">
      <aside 
        className={cn(
            "fixed inset-y-0 left-0 z-10 hidden sm:flex", 
            "h-full" 
        )}
      >
         <NewSidebar 
            isMobile={false} 
            isDesktopCollapsed={isDesktopSidebarCollapsed} 
            setIsDesktopCollapsed={setIsDesktopSidebarCollapsed} 
         />
      </aside>
      
      <div className={cn("flex flex-col sm:gap-4 transition-all duration-300 ease-in-out", contentPaddingClass)}>
        <AppHeader
          user={user}
          organizations={organizations}
          selectedOrg={selectedOrg}
          setSelectedOrg={setSelectedOrg}
          isAuthenticated={isAuthenticated}
          isSheetOpen={isSheetOpen}
          setIsSheetOpen={setIsSheetOpen}
          isDesktopSidebarCollapsed={isDesktopSidebarCollapsed}
          setIsDesktopSidebarCollapsed={setIsDesktopSidebarCollapsed}
          handleLogout={handleLogout}
        />
        
        <main className="flex-1 items-start gap-4 px-4 pb-4 pt-6 sm:px-6 md:gap-8 bg-muted/10"> {/* Changed pt-16 to pt-6 */}
          {children}
        </main>
      </div>
    </div>
  );
}
