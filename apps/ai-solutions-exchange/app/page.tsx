import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-4xl font-bold mb-4 text-nexus-900 dark:text-nexus-100">
        AI Solutions Exchange
      </h1>
      <p className="text-lg text-nexus-600 dark:text-nexus-400 max-w-xl mb-8">
        A marketplace for sourcing and delivering AI solutions and services.
      </p>
      <Link href="/founders">
        <Button size="lg">Explore Founders</Button>
      </Link>
    </main>
  );
}
