'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Loader2 } from 'lucide-react';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || 'Registration failed');
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-nexus-50 dark:bg-nexus-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md" padding="lg">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-2xl text-nexus-900 dark:text-nexus-100 mb-6">
            <svg className="w-10 h-10 text-hydra-600" viewBox="0 0 64 64" fill="none">
              <path d="M20 10h24l12 22-12 22H20L8 32 20 10Z" stroke="currentColor" strokeWidth="3"/>
              <path d="M23 24h18M23 32h18M23 40h10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
            </svg>
            <span>Business Exchange</span>
          </Link>
          <h1 className="text-2xl font-bold text-nexus-900 dark:text-nexus-100">Create Account</h1>
          <p className="text-nexus-500 dark:text-nexus-400 mt-2">Join the marketplace for founders and operators</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Full Name (optional)"
            placeholder="Jane Doe"
            error={errors.name?.message}
            autoComplete="name"
            {...register('name')}
          />
          <Input
            label="Email"
            type="email"
            error={errors.email?.message}
            placeholder="you@company.com"
            autoComplete="email"
            {...register('email')}
          />
          <Input
            label="Password"
            type="password"
            error={errors.password?.message}
            placeholder="••••••••"
            autoComplete="new-password"
            {...register('password')}
          />
          <Input
            label="Confirm Password"
            type="password"
            error={errors.confirmPassword?.message}
            placeholder="••••••••"
            autoComplete="new-password"
            {...register('confirmPassword')}
          />

          <p className="text-xs text-nexus-500 dark:text-nexus-400">
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </p>

          <Button type="submit" className="w-full" loading={isLoading}>
            {isLoading && <Loader2 className="w-4 h-4 mr-2" />}
            Create Account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-nexus-500 dark:text-nexus-400">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-hydra-600 dark:text-hydra-400 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}