
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
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', pass);

        // On suppose que l'API renvoie l'access_token et les infos utilisateur
        const data = await apiFetch('/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
        });

        // La réponse du backend doit contenir l'access_token et les infos de redirection
        if (data.access_token && data.redirect_to && data.role) {
            setToken(data.access_token);
            Cookies.set(AUTH_TOKEN_COOKIE, data.access_token, { expires: 7, secure: process.env.NODE_ENV === 'production' });

            // On crée un objet utilisateur à partir des données de l'API
            // Note: C'est un profil partiel. Idéalement, vous auriez une autre route /users/me pour obtenir le profil complet.
            const userProfile: AppUser = {
                id: 'temp-id', // Remplacer par l'ID utilisateur réel si l'API le renvoie
                email: email,
                role: data.role,
                firstName: 'Utilisateur', // Ces valeurs devraient venir d'un appel à /users/me
                lastName: '',
                username: email,
                status: 'active',
                createdAt: new Date().toISOString()
            };

            setUser(userProfile);
            Cookies.set(USER_DATA_COOKIE, JSON.stringify(userProfile), { expires: 7, secure: process.env.NODE_ENV === 'production' });

            toast({
                title: 'Connexion réussie !',
                description: 'Vous allez être redirigé...',
            });
            
            // On utilise le chemin de redirection fourni par le backend
            router.push(data.redirect_to);
        } else {
            throw new Error(data.detail || 'La réponse de l\'API est invalide.');
        }
    } catch (error: any) {
        console.error("Login failed:", error);
        toast({
            variant: 'destructive',
            title: 'Échec de la connexion',
            description: error.message || "Une erreur inconnue est survenue.",
        });
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
