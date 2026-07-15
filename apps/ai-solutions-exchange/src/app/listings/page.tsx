import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ListingsPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Listings</h1>
      <p className="mt-2 text-muted-foreground">
        Browse available AI solutions and services.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>No listings yet</CardTitle>
            <CardDescription>Check back soon.</CardDescription>
          </CardHeader>
          <CardContent />
        </Card>
      </div>
    </main>
  );
}
