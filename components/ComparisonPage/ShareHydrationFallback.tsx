import { Container } from '@/components/Layout/Container';
import { Header } from '@/components/Layout/Header';
import { Footer } from '@/components/Layout/Footer';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';

export function ShareHydrationFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <Container className="py-16 flex flex-col items-center">
        <LoadingSpinner />
        <p className="mt-4 text-sm text-gray-600">공유 링크를 준비하는 중입니다…</p>
      </Container>
      <Footer />
    </div>
  );
}
