
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { AppUser } from '@/lib/placeholder-data';
import Cookies from 'js-cookie';

interface AuthContextType {
  user: AppUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  // TODO: Add a function to fetch user profile if token exists but user object is null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const AUTH_TOKEN_COOKIE = 'authToken';
const USER_DATA_COOKIE = 'user';

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedToken = Cookies.get(AUTH_TOKEN_COOKIE);
      const storedUser = Cookies.get(USER_DATA_COOKIE);
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
        console.error("Failed to parse auth data from cookies", error);
        Cookies.remove(AUTH_TOKEN_COOKIE);
        Cookies.remove(USER_DATA_COOKIE);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, pass: string) => {
    setIsLoading(true);
    try {
        // FastAPI's default token endpoint expects form data
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', pass);

        const data = await apiFetch('/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
        });

        if (data.access_token) {
            setToken(data.access_token);
            Cookies.set(AUTH_TOKEN_COOKIE, data.access_token, { expires: 7, secure: true, sameSite: 'strict' });
            
            // TODO: Fetch user profile after getting the token
            // For now, we'll create a placeholder user object
            const placeholderUser: AppUser = {
                id: 'temp-id',
                email: email,
                role: 'admin', // Assume admin for now, but should come from a /users/me endpoint
                firstName: 'Admin',
                lastName: 'User',
                username: email,
                status: 'active',
                createdAt: new Date().toISOString()
            };
            setUser(placeholderUser);
            Cookies.set(USER_DATA_COOKIE, JSON.stringify(placeholderUser), { expires: 7, secure: true, sameSite: 'strict' });


            toast({
                title: 'Connexion réussie !',
                description: 'Vous allez être redirigé vers votre tableau de bord.',
            });
            router.push('/dashboard');
        } else {
            throw new Error(data.detail || 'Impossible de récupérer le jeton d\'accès.');
        }
    } catch (error: any) {
        console.error("Login failed:", error);
        toast({
            variant: 'destructive',
            title: 'Échec de la connexion',
            description: error.message || "Une erreur inconnue est survenue.",
        });
        // Clear any potentially stale data
        setUser(null);
        setToken(null);
        Cookies.remove(AUTH_TOKEN_COOKIE);
        Cookies.remove(USER_DATA_COOKIE);
    } finally {
        setIsLoading(false);
    }
  }, [router, toast]);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    Cookies.remove(AUTH_TOKEN_COOKIE);
    Cookies.remove(USER_DATA_COOKIE);
    router.push('/login');
  }, [router]);

  const value = { user, token, isLoading, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
