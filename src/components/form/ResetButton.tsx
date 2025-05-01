'use client';

interface ResetButtonProps {
  onClick: () => void;
}

export function ResetButton({ onClick }: ResetButtonProps) {

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={onClick}
        className={`w-full py-4 bg-gray-300 text-gray-500 rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 text-xl font-bold shadow-md border-2 border-white`}
      >
        フォームをリセット
      </button>
    </div>
  );
}