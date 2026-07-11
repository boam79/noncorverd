import { Suspense } from 'react';
import { HomePageContent } from '@/features/home/HomePageContent';

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center atmosphere text-ink-muted">
          불러오는 중…
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}
