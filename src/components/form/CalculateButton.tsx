'use client';

import { useFormStore } from '@/store/useFormStore';
import { useFormContext, FieldError } from 'react-hook-form';

interface CalculateButtonProps {
  onClick: () => void;
}

export function CalculateButton({ onClick }: CalculateButtonProps) {
  const { alliance } = useFormStore();
  const { formState } = useFormContext();
  
  // フォームにエラーがあるかどうかを確認
  const hasErrors = Object.keys(formState.errors).length > 0;
  
  // バリデーション状態に応じたメッセージ
  const buttonMessage = hasErrors ? '入力エラーがあります' : '計算する';
  const headerMessage = hasErrors
    ? '入力内容に問題があります。エラーメッセージを確認してください。'
    : '入力が完了したら計算ボタンを押してください';

  // アライアンスに応じたカラークラスを設定
  const colorClasses = alliance === 'セワクル'
    ? { primary: 'bg-sewakuru-primary', text: 'text-sewakuru-primary' }
    : { primary: 'bg-tokyu-primary', text: 'text-tokyu-primary' };

  return (
    <div>
      <h2 className={`text-center text-2xl font-bold mb-4 ${hasErrors ? 'text-red-600' : ''}`}>
        {headerMessage}
      </h2>
      {hasErrors && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <p className="font-medium">以下の問題を修正してください：</p>
          <ul className="list-disc pl-5 mt-2">
            {Object.entries(formState.errors).map(([field, error]) => (
              <li key={field}>
                {(error as FieldError)?.message || 'エラーがあります'}
              </li>
            ))}
          </ul>
        </div>
      )}
      <button
        type="button"
        onClick={onClick}
        className={`w-full py-10 ${hasErrors ? 'bg-red-500' : colorClasses.primary} text-white rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-4xl font-bold shadow-xl border-4 border-white ${hasErrors ? '' : 'animate-pulse'}`}
        style={{ boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)' }}
      >
        {buttonMessage}
      </button>
    </div>
  );
}