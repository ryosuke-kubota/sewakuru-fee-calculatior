'use client';

import { EstimateForm } from '@/components/form/EstimateForm';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto">
        <EstimateForm />
      </div>
    </div>
  );
}
