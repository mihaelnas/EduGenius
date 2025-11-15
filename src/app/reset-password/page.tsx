
'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';

const formSchema = z.object({
    newPassword: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères.'),
    confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas.',
    path: ['confirmPassword'],
});

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const token = searchParams.get('token');

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            newPassword: '',
            confirmPassword: '',
        },
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        if (!token) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Token de réinitialisation manquant.' });
            return;
        }

        try {
            await apiFetch('/auth/reset-password', {
                method: 'POST',
                body: JSON.stringify({ token, new_password: values.newPassword }),
            });
            toast({
                title: 'Succès !',
                description: 'Votre mot de passe a été réinitialisé. Vous pouvez maintenant vous connecter.',
            });
            router.push('/login');
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Échec de la réinitialisation',
                description: error.message || 'Le token est peut-être invalide ou expiré.',
            });
        }
    };

    if (!token) {
        return (
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle>Token Invalide</CardTitle>
                    <CardDescription>Le lien de réinitialisation est invalide ou a expiré.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild className="w-full">
                        <Link href="/login">Retour à la connexion</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card className="w-full max-w-sm shadow-2xl">
            <CardHeader>
                <CardTitle className="text-2xl font-headline">Réinitialiser votre mot de passe</CardTitle>
                <CardDescription>Choisissez un nouveau mot de passe pour votre compte.</CardDescription>
            </CardHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardContent className="grid gap-4">
                        <FormField
                            control={form.control}
                            name="newPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nouveau mot de passe</FormLabel>
                                    <FormControl><Input type="password" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirmer le mot de passe</FormLabel>
                                    <FormControl><Input type="password" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
                        </Button>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    );
}

export default function ResetPasswordPage() {
    return (
        // Suspense est nécessaire car useSearchParams ne fonctionne que côté client
        <Suspense fallback={<div>Chargement...</div>}>
            <ResetPasswordForm />
        </Suspense>
    );
}
