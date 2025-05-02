'use client';
import { Accordion } from '@/components/ui/Accordion';
import { Plan, useFormStore } from '@/store/useFormStore';
import { formatCurrency } from '@/utils/feeCalculator';
import { NonTaxableOption } from '@/store/useFormStore';
import { useFormContext } from 'react-hook-form';
import { NumberInput } from '@/components/ui/NumberInput';
import { useEffect } from 'react';

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
  plans
}: {
  option: NonTaxableOption,
  registerPrefix: string,
  updateOption: (id: string, data: Partial<NonTaxableOption>) => void,
  index: number,
  plans: Plan[]
}) {
  const { register, formState: { errors }, clearErrors } = useFormContext();
  
  // エラーオブジェクトの取得（型アサーションを使用）
  const fieldErrors = errors.nonTaxableOptions as Record<number, { unitPrice?: { message?: string }, count?: { message?: string } }> | undefined;

  // プランが更新された時の処理
  useEffect(() => {
    // 出張費の場合のみ処理
    if (option.id === 'nontaxable-transportation') {
      // プランの回数の合計を計算
      const totalPlanCount = plans.reduce((sum, plan) => sum + (plan.count || 0), 0);
      // 回数をプランの合計回数に合わせて更新
      updateOption(option.id, { count: totalPlanCount });
    }
  }, [plans]);
  
  return (
    <div className="p-4 border rounded-md bg-gray-50">
      <h3 className="text-sm font-medium mb-3">{option.name}</h3>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <NumberInput
            id={`${registerPrefix}UnitPrice`}
            value={option.unitPrice}
            min={0}
            step={100}
            label="単価"
            // required={option.count > 0}
            error={fieldErrors?.[index]?.unitPrice?.message}
            onChange={(value) => updateOption(option.id, { unitPrice: value })}
            register={register(`nonTaxableOptions.${index}.unitPrice`, {
              required: option.count > 0 ? '単価は必須です' : false,
              min: { value: 0, message: '単価は0以上で入力してください' },
              setValueAs: (v) => v === "" ? undefined : parseInt(v, 10),
              onChange: () => {
                // TypeScriptエラーを回避するために型アサーションを使用
                const fieldErrors = errors.nonTaxableOptions as Record<number, { unitPrice?: { message?: string } }> | undefined;
                if (fieldErrors?.[index]?.unitPrice) {
                  clearErrors(`nonTaxableOptions.${index}.unitPrice`);
                }
              }
            })}
          />
          <NumberInput
            id={`${registerPrefix}Count`}
            value={option.count}
            min={0}
            step={1}
            label="回数"
            // required={option.unitPrice > 0}
            error={fieldErrors?.[index]?.count?.message}
            onChange={(value) => updateOption(option.id, { count: value })}
            register={register(`nonTaxableOptions.${index}.count`, {
              required: option.unitPrice > 0 ? '回数は必須です' : false,
              min: { value: 0, message: '回数は0以上で入力してください' },
              setValueAs: (v) => v === "" ? undefined : parseInt(v, 10),
              onChange: () => {
                // TypeScriptエラーを回避するために型アサーションを使用
                const fieldErrors = errors.nonTaxableOptions as Record<number, { count?: { message?: string } }> | undefined;
                if (fieldErrors?.[index]?.count) {
                  clearErrors(`nonTaxableOptions.${index}.count`);
                }
              }
            })}
          />
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
    plans
  } = useFormStore();
  
  const { register, formState: { errors }, clearErrors } = useFormContext();

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
            plans={plans}
          />
        ))}

        {/* その他非課税オプション（動的追加） */}
        {nonTaxableOptions
          .filter(option => !FIXED_OPTIONS.map(o => o.id).includes(option.id))
          .map((option, dynamicIndex) => {
            // 固定オプションの数を考慮したインデックス
            const index = FIXED_OPTIONS.length + dynamicIndex;
            return (
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
                  {...register(`nonTaxableOptions.${index}.name`, {
                    required: option.count > 0 || option.unitPrice > 0 ? 'オプション名は必須です' : false,
                    onChange: (e) => updateNonTaxableOption(option.id, { name: e.target.value })
                  })}
                  defaultValue={option.name}
                />
                {/* @ts-expect-error - React Hook Form型定義の問題を回避 */}
                {errors.nonTaxableOptions?.[index]?.name && (
                  <p className="mt-1 text-sm text-red-600">
                    {(errors.nonTaxableOptions as Record<number, { name?: { message?: string } }>)[index]?.name?.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">


                {/* 単価 */}
                <NumberInput
                  id={`non-taxable-price-${option.id}`}
                  value={option.unitPrice}
                  min={0}
                  step={100}
                  label="単価"
                  // required={option.count > 0}
                  error={(errors.nonTaxableOptions as Record<number, { unitPrice?: { message?: string } }>)?.[index]?.unitPrice?.message}
                  onChange={(value) => updateNonTaxableOption(option.id, { unitPrice: value })}
                  register={register(`nonTaxableOptions.${index}.unitPrice`, {
                    required: option.count > 0 ? '単価は必須です' : false,
                    min: { value: 0, message: '単価は0以上で入力してください' },
                    valueAsNumber: true,
                    onChange: () => {
                      // TypeScriptエラーを回避するために型アサーションを使用
                      const fieldErrors = errors.nonTaxableOptions as Record<number, { unitPrice?: { message?: string } }> | undefined;
                      if (fieldErrors?.[index]?.unitPrice) {
                        clearErrors(`nonTaxableOptions.${index}.unitPrice`);
                      }
                    }
                  })}
                />

                {/* 回数 */}
                <NumberInput
                  id={`non-taxable-count-${option.id}`}
                  value={option.count}
                  min={1}
                  step={1}
                  label="回数"
                  // required={option.unitPrice > 0}
                  error={(errors.nonTaxableOptions as Record<number, { count?: { message?: string } }>)?.[index]?.count?.message}
                  onChange={(value) => updateNonTaxableOption(option.id, { count: value })}
                  register={register(`nonTaxableOptions.${index}.count`, {
                    required: option.unitPrice > 0 ? '回数は必須です' : false,
                    min: { value: 1, message: '回数は1以上で入力してください' },
                    valueAsNumber: true,
                    onChange: () => {
                      // TypeScriptエラーを回避するために型アサーションを使用
                      const fieldErrors = errors.nonTaxableOptions as Record<number, { count?: { message?: string } }> | undefined;
                      if (fieldErrors?.[index]?.count) {
                        clearErrors(`nonTaxableOptions.${index}.count`);
                      }
                    }
                  })}
                />
              </div>

              {/* 小計表示 */}
              {option.name && option.count > 0 && option.unitPrice > 0 && (
                <div className="text-right text-sm font-medium">
                  小計: {formatCurrency(option.unitPrice * option.count)} (非課税)
                </div>
              )}
            </div>
          </div>
        );
        })}

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