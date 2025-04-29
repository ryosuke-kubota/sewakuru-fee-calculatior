'use client';
import { Accordion } from '@/components/ui/Accordion';
import { useFormStore } from '@/store/useFormStore';
import { formatCurrency } from '@/utils/feeCalculator';
import { NonTaxableOption } from '@/store/useFormStore';
import { useFormContext } from 'react-hook-form';

// 固定非課税オプションの定義
const FIXED_OPTIONS = [
  { id: 'nontaxable-transportation', name: '出張費', registerPrefix: 'transportationFee' },
  { id: 'nontaxable-parking', name: '駐車料金', registerPrefix: 'parking' },
  { id: 'nontaxable-public-transport', name: '公共交通機関', registerPrefix: 'publicTransport' },
  { id: 'nontaxable-key-shipping', name: '鍵郵送代', registerPrefix: 'keyShipping' },
];

// 非課税オプション入力コンポーネント
function NonTaxableOptionInput({
  option,
  registerPrefix,
  updateOption,
  index,
}: {
  option: NonTaxableOption,
  registerPrefix: string,
  updateOption: (id: string, data: Partial<NonTaxableOption>) => void,
  index: number,
}) {
  const { register, formState: { errors } } = useFormContext();
  
  // エラーオブジェクトの取得（型アサーションを使用）
  const fieldErrors = errors.nonTaxableOptions as Record<number, { unitPrice?: { message?: string }, count?: { message?: string } }> | undefined;
  
  return (
    <div className="p-4 border rounded-md bg-gray-50">
      <h3 className="text-sm font-medium mb-3">{option.name}</h3>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor={`${registerPrefix}UnitPrice`} className="block text-sm font-medium text-gray-700 mb-1">
              単価 <span className="text-red-500">*</span>
            </label>
            <input
              id={`${registerPrefix}UnitPrice`}
              type="number"
              min="0"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                fieldErrors?.[index]?.unitPrice ? 'border-red-500' : ''
              }`}
              {...register(`nonTaxableOptions.${index}.unitPrice`, {
                required: option.count > 0 ? '単価は必須です' : false,
                min: { value: 0, message: '単価は0以上で入力してください' },
                valueAsNumber: true,
                onChange: (e) => updateOption(option.id, { unitPrice: parseInt(e.target.value) || 0 })
              })}
              defaultValue={option.unitPrice}
            />
            {fieldErrors?.[index]?.unitPrice && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors[index].unitPrice?.message}</p>
            )}
          </div>
          <div>
            <label htmlFor={`${registerPrefix}Count`} className="block text-sm font-medium text-gray-700 mb-1">
              回数 <span className="text-red-500">*</span>
            </label>
            <input
              id={`${registerPrefix}Count`}
              type="number"
              min="0"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                fieldErrors?.[index]?.count ? 'border-red-500' : ''
              }`}
              {...register(`nonTaxableOptions.${index}.count`, {
                required: option.unitPrice > 0 ? '回数は必須です' : false,
                min: { value: 0, message: '回数は0以上で入力してください' },
                valueAsNumber: true,
                onChange: (e) => updateOption(option.id, { count: parseInt(e.target.value) || 0 })
              })}
              defaultValue={option.count}
            />
            {fieldErrors?.[index]?.count && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors[index].count?.message}</p>
            )}
          </div>
        </div>
        {option.count > 0 && option.unitPrice > 0 && (
          <div className="text-right text-sm font-medium mt-3">
            小計: {formatCurrency(option.unitPrice * option.count)}
          </div>
        )}
      </div>
    </div>
  );
}

export function NonTaxableOptionsSection() {
  const {
    nonTaxableOptions,
    setTransportationFee,
    addNonTaxableOption,
    updateNonTaxableOption,
    removeNonTaxableOption,
  } = useFormStore();
  
  const { register, formState: { errors } } = useFormContext();

  // 出張費の更新ハンドラー（互換性のために残す）
  const handleTransportationUpdate = (id: string, data: Partial<NonTaxableOption>) => {
    // 非課税オプションを更新
    updateNonTaxableOption(id, data);
    
    // transportationFeeの状態も同期して更新（互換性のため）
    if (data.count !== undefined) {
      setTransportationFee(data.count);
    }
    if (data.unitPrice !== undefined) {
      const newState = useFormStore.getState();
      useFormStore.setState({
        transportationFee: {
          count: newState.transportationFee.count,
          unitPrice: data.unitPrice
        }
      });
    }
  };

  // 固定オプションの取得
  const getFixedOption = (id: string): NonTaxableOption => {
    // すべての固定オプションを非課税オプションから取得
    const option = nonTaxableOptions.find(o => o.id === id);
    if (option) return option;
    
    // 見つからない場合はデフォルト値を返す
    const defaultOption = FIXED_OPTIONS.find(o => o.id === id);
    return {
      id,
      name: defaultOption?.name || '',
      count: 0,
      unitPrice: 0
    };
  };

  // 更新ハンドラーの取得
  const getUpdateHandler = (id: string) => {
    if (id === 'nontaxable-transportation') {
      return handleTransportationUpdate;
    }
    return updateNonTaxableOption;
  };

  return (
    <Accordion title="非課税オプション" defaultOpen={true}>
      <div className="space-y-4">
        {/* 固定非課税オプション */}
        {FIXED_OPTIONS.map((option, index) => (
          <NonTaxableOptionInput
            key={option.id}
            option={getFixedOption(option.id)}
            registerPrefix={option.registerPrefix}
            updateOption={getUpdateHandler(option.id)}
            index={index}
          />
        ))}

        {/* その他非課税オプション（動的追加） */}
        {nonTaxableOptions
          .filter(option => !FIXED_OPTIONS.map(o => o.id).includes(option.id))
          .map((option, index) => (
          <div key={option.id} className="p-4 border rounded-md bg-gray-50">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium">その他非課税オプション {index + 1}</h3>
              <button
                type="button"
                className="text-red-500 hover:text-red-700"
                onClick={() => removeNonTaxableOption(option.id)}
              >
                削除
              </button>
            </div>

            <div className="space-y-3">
              {/* オプション名 */}
              <div>
                <label htmlFor={`non-taxable-name-${option.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                  オプション名 <span className="text-red-500">*</span>
                </label>
                <input
                  id={`non-taxable-name-${option.id}`}
                  type="text"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="その他"
                  {...register(`nonTaxableOptions.${option.id}.name`, {
                    required: 'オプション名は必須です',
                    onChange: (e) => updateNonTaxableOption(option.id, { name: e.target.value })
                  })}
                  defaultValue={option.name}
                />
                {/* @ts-expect-error - React Hook Form型定義の問題を回避 */}
                {errors.nonTaxableOptions?.[option.id]?.name && (
                  <p className="mt-1 text-sm text-red-600">
                    {(errors.nonTaxableOptions as Record<number, { name?: { message?: string } }>)[option.id]?.name?.message}
                  </p>
                )}
              </div>

              {/* 単価 */}
              <div>
                <label htmlFor={`non-taxable-price-${option.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                  単価 <span className="text-red-500">*</span>
                </label>
                <input
                  id={`non-taxable-price-${option.id}`}
                  type="number"
                  min="0"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register(`nonTaxableOptions.${option.id}.unitPrice`, {
                    required: option.count > 0 ? '単価は必須です' : false,
                    min: { value: 0, message: '単価は0以上で入力してください' },
                    valueAsNumber: true,
                    onChange: (e) => updateNonTaxableOption(option.id, { unitPrice: parseInt(e.target.value) || 0 })
                  })}
                  defaultValue={option.unitPrice}
                />
                {/* @ts-expect-error - React Hook Form型定義の問題を回避 */}
                {errors.nonTaxableOptions?.[option.id]?.unitPrice && (
                  <p className="mt-1 text-sm text-red-600">
                    {(errors.nonTaxableOptions as Record<number, { unitPrice?: { message?: string } }>)[option.id]?.unitPrice?.message}
                  </p>
                )}
              </div>

              {/* 回数 */}
              <div>
                <label htmlFor={`non-taxable-count-${option.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                  回数 <span className="text-red-500">*</span>
                </label>
                <input
                  id={`non-taxable-count-${option.id}`}
                  type="number"
                  min="1"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register(`nonTaxableOptions.${option.id}.count`, {
                    required: option.unitPrice > 0 ? '回数は必須です' : false,
                    min: { value: 1, message: '回数は1以上で入力してください' },
                    valueAsNumber: true,
                    onChange: (e) => updateNonTaxableOption(option.id, { count: parseInt(e.target.value) || 1 })
                  })}
                  defaultValue={option.count}
                />
                {/* @ts-expect-error - React Hook Form型定義の問題を回避 */}
                {errors.nonTaxableOptions?.[option.id]?.count && (
                  <p className="mt-1 text-sm text-red-600">
                    {(errors.nonTaxableOptions as Record<number, { count?: { message?: string } }>)[option.id]?.count?.message}
                  </p>
                )}
              </div>

              {/* 小計表示 */}
              {option.name && option.count > 0 && option.unitPrice > 0 && (
                <div className="text-right text-sm font-medium">
                  小計: {formatCurrency(option.unitPrice * option.count)} (非課税)
                </div>
              )}
            </div>
          </div>
        ))}

        <button
          type="button"
          className="w-full py-2 px-4 border border-blue-500 text-blue-500 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          onClick={addNonTaxableOption}
        >
          + その他非課税オプションを追加
        </button>
      </div>
    </Accordion>
  );
}