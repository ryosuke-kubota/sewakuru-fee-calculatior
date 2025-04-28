'use client';

import { useFormStore } from '@/store/useFormStore';

interface CalculateButtonProps {
  onClick: () => void;
}

export function CalculateButton({ onClick }: CalculateButtonProps) {
  const { alliance } = useFormStore();

  // アライアンスに応じたカラークラスを設定
  const colorClasses = alliance === 'セワクル' 
    ? { primary: 'bg-sewakuru-primary', text: 'text-sewakuru-primary' }
    : { primary: 'bg-tokyu-primary', text: 'text-tokyu-primary' };

  return (
    <div>
      <h2 className="text-center text-2xl font-bold mb-4">入力が完了したら計算ボタンを押してください</h2>
      <button
        type="button"
        onClick={onClick}
        className={`w-full py-10 ${colorClasses.primary} text-white rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-4xl font-bold shadow-xl border-4 border-white animate-pulse`}
        style={{ boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)' }}
      >
        計算する
      </button>
    </div>
  );
}