'use client';

import { useFormStore } from '@/store/useFormStore';
import { formatCurrency } from '@/utils/feeCalculator';
// import { ResetButton } from './ResetButton';
// import { CalculateButton } from './CalculateButton';

export function FormSummary() {
  const { calculationResult, alliance } = useFormStore();

  // アライアンスに応じたカラークラスを設定
  const colorClasses = alliance === 'セワクル' 
    ? { primary: 'bg-sewakuru-primary', light: 'bg-sewakuru-light', text: 'text-sewakuru-primary' }
    : { primary: 'bg-tokyu-primary', light: 'bg-tokyu-light', text: 'text-tokyu-primary' };

  if (!calculationResult) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-md p-3 z-0">
        <div className="max-w-md mx-auto text-center text-gray-500 text-sm">
          計算ボタンを押すと、ここに合計金額が表示されます。
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-md p-3 z-0">
      <div className="max-w-md mx-auto">
        <div className="grid grid-cols-4 gap-2 text-sm">
          <div className="text-center">
            <div className="font-medium">課税</div>
            <div className={colorClasses.text}>
              {formatCurrency(calculationResult.subtotalTaxExcluded)}
            </div>
          </div>
          <div className="text-center">
            <div className="font-medium">消費税</div>
            <div className={colorClasses.text}>
              {formatCurrency(calculationResult.tax)}
            </div>
          </div>
          <div className="text-center">
            <div className="font-medium">非課税</div>
            <div className={colorClasses.text}>
              {formatCurrency(calculationResult.nonTaxableTotal)}
            </div>
          </div>
          <div className="text-center">
            <div className="font-medium">合計</div>
            <div className={`${colorClasses.text} font-bold`}>
              {formatCurrency(calculationResult.grandTotal)}
            </div>
          </div>
        </div>
        {/* <div className='flex'>
          <CalculateButton onClick={onSubmit} />
          <ResetButton onClick={resetForm} />
        </div> */}
      </div>
    </div>
  );
}