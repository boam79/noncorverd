import { Container } from '@/components/Layout/Container';
import { Header } from '@/components/Layout/Header';
import { Footer } from '@/components/Layout/Footer';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';

export function ShareHydrationFallback() {
  return (
    <div className="flex min-h-screen flex-col atmosphere">
      <Header />
      <Container className="flex flex-col items-center py-16">
        <LoadingSpinner />
        <p className="mt-4 text-sm text-ink-muted">공유 링크를 준비하는 중입니다…</p>
      </Container>
      <Footer />
    </div>
  );
}
