import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-8 px-6 py-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">AI Solutions Exchange</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Source, list, and deliver AI-powered solutions and services.
        </p>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            The exchange is under active development. Browse listings once they go live.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full">Get Notified</Button>
        </CardContent>
      </Card>
    </main>
  );
}
