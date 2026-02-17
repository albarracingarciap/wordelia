"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { signout } from "@/app/auth/actions";

// Define the shape of the context state
interface AuthState {
    user: User | null;
    isLoggedIn: boolean;
    isLoading: boolean;
    login: () => void; // Deprecated: login is now handled via Server Actions + Middleware
    logout: () => void;
}

// Create the context
const AuthContext = createContext<AuthState>({
    user: null,
    isLoggedIn: false,
    isLoading: true,
    login: () => { },
    logout: () => { },
});

// Custom hook to use the context
export const useAuth = () => useContext(AuthContext);

// Provider component
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter(); // Use App Router's useRouter
    const supabase = createClient();

    useEffect(() => {
        // Check active session
        const checkUser = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                setUser(session?.user ?? null);
            } catch (error) {
                console.error("Error checking session:", error);
            } finally {
                setIsLoading(false);
            }
        };

        checkUser();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setIsLoading(false);
            if (_event === 'SIGNED_OUT') {
                router.refresh(); // Refresh server components
                router.push("/login");
            } else if (_event === 'SIGNED_IN') {
                router.refresh();
            }
        });

        return () => subscription.unsubscribe();
    }, [router, supabase]);

    // Mock login function for backwards compatibility or client-side triggers if needed
    // In reality, login happens via form submission to server action
    const login = () => {
        // No-op or redirect to login page
        router.push("/login");
    };

    const logout = async () => {
        await signout(); // Call server action
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            isLoggedIn: !!user,
            isLoading,
            login,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
};
