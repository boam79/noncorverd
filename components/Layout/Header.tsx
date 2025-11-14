'use client';

import { useRouter } from 'next/navigation';

interface HeaderProps {
  onHomeClick?: () => void;
}

export function Header({ onHomeClick }: HeaderProps = {}) {
  const router = useRouter();

  const handleHomeClick = () => {
    if (onHomeClick) {
      onHomeClick();
    }
    router.push('/');
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <h1 
          onClick={handleHomeClick}
          className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-primary-600 transition-colors"
        >
          🏥 의료기관 비급여 비교 서비스
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          전국 병원 비급여 수가 검색·비교
        </p>
      </div>
    </header>
  );
}

