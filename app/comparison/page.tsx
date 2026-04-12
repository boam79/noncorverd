import { Suspense } from 'react';
import { ShareHydrationFallback } from '@/components/ComparisonPage/ShareHydrationFallback';
import { ComparisonPageClient } from '@/features/comparison/ComparisonPageClient';

export default function ComparisonPage() {
  return (
    <Suspense fallback={<ShareHydrationFallback />}>
      <ComparisonPageClient />
    </Suspense>
  );
}
