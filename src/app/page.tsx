import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GraduationCap, UserCog, Users, Zap, BookCheck, ShieldCheck, ArrowRight } from 'lucide-react';
import { Logo } from '@/components/logo';
import { placeholderImages } from '@/lib/placeholder-images';

const features = [
  {
    icon: <UserCog />,
    title: 'Gestion Administrative',
    description: 'Gérez sans effort les utilisateurs, les classes et les matières.',
  },
  {
    icon: <GraduationCap />,
    title: 'Espace Enseignant Complet',
    description: 'Créez des cours, gérez vos classes, et organisez votre emploi du temps.',
  },
  {
    icon: <Users />,
    title: 'Portail Étudiant Intuitif',
    description: 'Accédez à vos supports de cours et suivez votre parcours d\'apprentissage.',
  },
    {
    icon: <Zap />,
    title: 'Interaction en Temps Réel',
    description: 'Des outils de communication pour une meilleure collaboration.',
  },
  {
    icon: <BookCheck />,
    title: 'Suivi des Progrès',
    description: 'Visualisez les performances et les résultats en un clin d\'œil.',
  },
  {
    icon: <ShieldCheck />,
    title: 'Sécurité et Fiabilité',
    description: 'Une plateforme robuste pour protéger vos données et assurer la continuité.',
  },
];

export default function Home() {
  const heroImage = placeholderImages.find(p => p.id === 'homepage-hero');

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6 sticky top-0 z-50 bg-background/80 backdrop-blur-sm">
        <Logo />
        <nav className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">Connexion</Link>
          </Button>
          <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Link href="/register">S'inscrire</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        <section className="relative w-full pt-20 pb-24 md:pt-32 md:pb-36 lg:pt-40 lg:pb-48 flex items-center">
           {heroImage && (
             <Image
              src={heroImage.imageUrl}
              alt={heroImage.description}
              fill
              className="absolute inset-0 -z-10 h-full w-full object-cover opacity-10"
              data-ai-hint={heroImage.imageHint}
              priority
            />
          )}
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/50 to-background" />

          <div className="container mx-auto px-4 text-center md:px-6">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl font-extrabold tracking-tighter text-primary sm:text-5xl md:text-6xl lg:text-7xl font-headline">
                L'Éducation de Demain, Aujourd'hui.
              </h1>
              <p className="mt-6 text-lg leading-8 text-foreground/80 max-w-2xl mx-auto">
                EduGenius est la plateforme tout-en-un conçue pour simplifier l'apprentissage, l'enseignement et la gestion administrative. Puissance, simplicité et collaboration.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Button size="lg" asChild>
                  <Link href="/register">Commencer Gratuitement <ArrowRight className="ml-2"/></Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="#features">Découvrir les fonctionnalités</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-20 md:py-28 bg-card">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto max-w-3xl text-center">
                <h2 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl font-headline">
                  Une Plateforme Conçue Pour la Réussite
                </h2>
                <p className="mt-4 text-lg text-foreground/70">
                  EduGenius offre une expérience unique et adaptée, que vous soyez administrateur, enseignant ou étudiant.
                </p>
            </div>
            <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <Card key={feature.title} className="flex flex-col text-left shadow-lg hover:shadow-primary/10 transition-all duration-300 transform hover:-translate-y-2 border-transparent hover:border-primary/50 bg-background/50">
                  <CardHeader>
                     <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      {feature.icon}
                    </div>
                    <CardTitle className="font-headline text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground/70">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-foreground text-background">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-8 md:flex-row md:px-6">
          <Logo />
          <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} EduGenius. Tous droits réservés.</p>
          <div className="flex gap-4">
            <Link href="#" className="text-sm text-muted-foreground hover:text-background">Politique de Confidentialité</Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-background">Conditions d'Utilisation</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
