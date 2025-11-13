
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
  // La gestion du token est maintenant implicite via les cookies HttpOnly,
  // donc plus besoin de l'exposer dans le contexte.
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const USER_DATA_COOKIE = 'user-data'; // Cookie accessible par le client

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Au chargement, on vérifie si les informations de l'utilisateur sont dans un cookie
    try {
      const storedUser = Cookies.get(USER_DATA_COOKIE);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
        console.error("Failed to parse user data from cookies", error);
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

        const data = await apiFetch('/auth/Connexion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
        });
        
        // Le backend place les tokens dans des cookies HttpOnly.
        // Le frontend n'a qu'à lire la réponse JSON pour obtenir les infos utilisateur et la redirection.
        if (data.role && data.redirect_to) {
            // On peut créer un profil partiel pour l'UI, le profil complet
            // serait idéalement récupéré via une route /users/me
            const userProfile: AppUser = {
                id: 'temp-id', // À remplacer par un vrai ID depuis une route /users/me
                email: email,
                role: data.role,
                firstName: 'Utilisateur',
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
            description: error.message || "Email ou mot de passe incorrect.",
        });
        setUser(null);
        Cookies.remove(USER_DATA_COOKIE);
    } finally {
        setIsLoading(false);
    }
  }, [router, toast]);

  const logout = useCallback(() => {
    // Le logout devrait aussi appeler une route backend pour invalider les tokens si possible
    setUser(null);
    Cookies.remove(USER_DATA_COOKIE);
    // Les cookies HttpOnly seront probablement supprimés par le backend ou expirés, mais on redirige
    router.push('/login');
  }, [router]);

  const value = { user, isLoading, login, logout };

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
