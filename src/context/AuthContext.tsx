'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';

// Added export here
export interface User {
  id: number; email: string; name: string; picture?: string;
}

export interface Organization { // Already exported
  id: number; name: string; wyzio_id?: string;
}

interface AuthContextType {
  user: User | null;
  organizations: Organization[]; 
  selectedOrg: Organization | null; 
  setSelectedOrg: (org: Organization | null) => void; 
  isLoading: boolean;
  isAuthenticated: boolean;
  checkAuthStatus: () => Promise<void>; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null); 
  const [isLoading, setIsLoading] = useState(true); 
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuthStatus = useCallback(async () => {
    setIsLoading(true); 
    let fetchedOrgs: Organization[] = []; 
    let wasAuthenticated = false;
    let fetchedUser: User | null = null;
    const apiUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/me`;

    try {
      const response = await fetch(apiUrl, { headers: { 'Accept': 'application/json' }, credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
           fetchedUser = data.user;
           fetchedOrgs = data.organizations || [];
           wasAuthenticated = true;
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setUser(fetchedUser);
      setOrganizations(fetchedOrgs);
      setIsAuthenticated(wasAuthenticated);
      setIsLoading(false); 
       
      if (wasAuthenticated && fetchedOrgs.length > 0) {
            // Prioritize "TEST COMPANY SA" if it exists
            const testCompany = fetchedOrgs.find(org => org.name === "TEST COMPANY SA");
            setSelectedOrg(prevSelected => {
                if (testCompany) return testCompany; // Default to TEST COMPANY SA if found
                // Fallback logic if TEST COMPANY SA is not found or for other cases
                const stillExists = fetchedOrgs.some(org => org.id === prevSelected?.id);
                if (prevSelected && stillExists) return prevSelected;
                return fetchedOrgs[0]; // Default to first in the list
            });
      } else {
           setSelectedOrg(null); 
      }
    }
  }, []); 

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]); 

  const contextValue = React.useMemo(() => ({
     user, organizations, selectedOrg, setSelectedOrg, isLoading, isAuthenticated, checkAuthStatus
  }), [user, organizations, selectedOrg, isLoading, isAuthenticated, checkAuthStatus]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
