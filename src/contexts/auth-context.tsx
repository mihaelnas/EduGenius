
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { AppUser } from '@/lib/placeholder-data';
import Cookies from 'js-cookie';

interface AuthContextType {
  user: AppUser | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const USER_DATA_COOKIE = 'user-data';

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const fetchUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const storedUser = Cookies.get(USER_DATA_COOKIE);
      if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          // Optionnel: re-valider l'utilisateur avec une route /me
          // Pour l'instant, on fait confiance au cookie
          const userProfile = await apiFetch(`/auth/me`);
          setUser(userProfile);
      } else {
          setUser(null);
      }
    } catch (error) {
        console.error("Failed to fetch or parse user data", error);
        // Si la récupération de /me échoue, c'est que le token n'est plus valide
        setUser(null);
        Cookies.remove(USER_DATA_COOKIE);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback(async (email: string, pass: string) => {
    setIsLoading(true);
    try {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', pass);

        const data = await apiFetch('/auth/Connexion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
        });
        
        if (data.user_info && data.redirect_to) {
            const userProfile: AppUser = data.user_info;

            setUser(userProfile);
            Cookies.set(USER_DATA_COOKIE, JSON.stringify(userProfile), { expires: 7, secure: process.env.NODE_ENV === 'production' });

            toast({
                title: 'Connexion réussie !',
                description: 'Vous allez être redirigé...',
            });
            
            router.push(data.redirect_to);
        } else {
            throw new Error(data.detail || 'La réponse de l\'API est invalide.');
        }
    } catch (error: any) {
        console.error("Login failed:", error);
        toast({
            variant: 'destructive',
            title: 'Échec de la connexion',
            description: error.message || "Email ou mot de passe incorrect.",
        });
        setUser(null);
        Cookies.remove(USER_DATA_COOKIE);
    } finally {
        setIsLoading(false);
    }
  }, [router, toast]);

  const logout = useCallback(async () => {
    try {
        await apiFetch('/auth/Deconnexion', { method: 'POST' });
    } catch(error) {
        console.error("Logout API call failed, proceeding with client-side logout", error);
    } finally {
        setUser(null);
        Cookies.remove(USER_DATA_COOKIE);
        router.push('/login');
        toast({ title: 'Déconnexion', description: 'Vous avez été déconnecté.' });
    }
  }, [router, toast]);

  const value = { user, isLoading, login, logout, fetchUser };

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
