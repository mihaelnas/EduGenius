
'use client';

import Link from 'next/link';
import { GraduationCap } from 'lucide-react';

export function Logo() {
  // As Firebase is removed, always link to the homepage.
  const href = '/';

  return (
    <Link href={href} className="flex items-center gap-2 group" prefetch={false}>
      <div className="p-2 bg-primary group-hover:bg-accent rounded-lg transition-colors">
        <GraduationCap className="h-6 w-6 text-primary-foreground" />
      </div>
      <span className="text-xl font-bold text-primary group-hover:text-accent transition-colors font-headline tracking-tighter">
        EduGenius
      </span>
    </Link>
  );
}
