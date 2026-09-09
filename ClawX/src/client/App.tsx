import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { useState } from 'react';
import { Route, Switch } from 'wouter';
import { trpc } from '@/lib/trpc';
import DashboardLayout from '@/components/DashboardLayout';
import Home from '@/pages/Home';
import Chat from '@/pages/Chat';
import Analytics from '@/pages/Analytics';
import Governance from '@/pages/Governance';
import Settings from '@/pages/Settings';
import { Toaster } from 'sonner';

export default function App() {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: '/api/trpc',
        }),
      ],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <DashboardLayout>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/chat" component={Chat} />
            <Route path="/chat/:id" component={Chat} />
            <Route path="/analytics" component={Analytics} />
            <Route path="/governance" component={Governance} />
            <Route path="/settings" component={Settings} />
          </Switch>
        </DashboardLayout>
        <Toaster richColors position="top-right" />
      </QueryClientProvider>
    </trpc.Provider>
  );
}
