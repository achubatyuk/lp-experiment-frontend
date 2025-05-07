'use client'; 

import { Button } from "@/components/ui/button"; // Import ShadCN Button again
import Image from "next/image";
import { useEffect, useState } from 'react'; 
import { useRouter } from 'next/navigation';
import { useAuth } from "@/context/AuthContext"; 
import { motion, AnimatePresence } from 'framer-motion'; 

// Google Icon Component (from the yellow button we had)
const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 0 24 24" width="20px" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path d="M1 1h22v22H1z" fill="none"/></svg>
);

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth(); 
  const [showWelcomeContent, setShowWelcomeContent] = useState(false);

  // Effect to show Welcome content after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcomeContent(true);
    }, 500); // Show after 0.5 seconds
    return () => clearTimeout(timer);
  }, []);

  // Effect to redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleGoogleSignIn = () => {
    const backendLoginUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/login/google`;
    window.location.href = backendLoginUrl; 
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">Loading...</div>; 
  }

  if (!isAuthenticated) { 
    return (
      <div className="flex min-h-screen bg-white font-poppins">
        {/* Left Side (Login Form) */}
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-8 md:p-16">
          <div className="w-full max-w-xs flex flex-col items-center">
            
            <AnimatePresence>
              {showWelcomeContent && (
                <motion.div 
                  className="text-center w-full" 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <h1 className="text-3xl font-semibold text-gray-900 mb-2">Welcome!</h1>
                  <p className="text-base text-gray-600 mb-10">
                    Please login to access your account.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
            
            <AnimatePresence>
              {showWelcomeContent && (
                <motion.div
                  className="w-full"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <Button // Using ShadCN Button again
                    className="w-full h-14 text-base font-semibold bg-[#FFB51F] text-gray-900 hover:bg-[#FFB51F]/90 flex items-center justify-center gap-3 py-3 rounded-lg shadow-md"
                    onClick={handleGoogleSignIn} 
                  >
                    <GoogleIcon />
                    Login {/* Changed text to "Login" */}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>

        {/* Right Side (Image Area) - Stays the same */}
        <div className="hidden md:flex md:w-1/2 bg-[#F8F9FD] items-center justify-center relative p-8">
          <div className="absolute top-16 right-16 z-10"> 
            <Image 
              src="/ledgerlink-logo-dark.svg" 
              alt="LedgerLink Logo" 
              width={180} 
              height={40} 
              priority 
            />
          </div>
          <Image 
            src="/application-screenshot.png" 
            alt="Application Screenshot"
            width={857} 
            height={463} 
            priority 
            className="object-contain max-w-full max-h-full" 
          />
        </div>
      </div>
    );
  }

  return <div className="min-h-screen flex items-center justify-center bg-gray-100">Redirecting...</div>; 
}
