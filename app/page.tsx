'use client';

import { useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { useRouter } from 'next/navigation';
import { PageLoader } from './components/LoadingSpinner';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Skip authentication for development - go directly to dashboard
    if (!isLoading) {
      router.push('/dashboard');
    }
  }, [isLoading, router]);

  return <PageLoader />;
}