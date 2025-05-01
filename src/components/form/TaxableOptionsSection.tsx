'use client';

import { useFormContext, FieldPath } from 'react-hook-form';
import type { FormValues } from './EstimateForm';
import { Accordion } from '@/components/ui/Accordion';
import { useFormStore } from '@/store/useFormStore';
import {
  formatCurrency,
  OLD_ADDITIONAL_PET_FEE,
  NEW_ADDITIONAL_PET_FEE,
  OLD_KEY_HANDLING_FEE,
  NEW_KEY_HANDLING_FEE
} from '@/utils/feeCalculator';
import { NumberInput } from '@/components/ui/NumberInput';

export function TaxableOptionsSection() {

  const { register, formState: { errors } } = useFormContext<FormValues>();
  
  // エラーオブジェクトの型定義
  type MultiPetErrors = {
    additionalPets?: {
      message: string;
    };
  };
  
  type KeyHandlingErrors = {
    count?: {
      message: string;
    };
  };
  
  const {
    multiPet,
    keyHandling,
    taxableOptions,
    plans,
    feeSelection,
    setMultiPet,
    setKeyHandling,
    addTaxableOption,
    updateTaxableOption,
    removeTaxableOption,
  } = useFormStore();

  // 15分延長以外のプランの合計回数を計算
  const totalPlanCount = plans.reduce((sum, plan) => {
    // 15分延長プランは除外
    if (plan.name === '15分延長') return sum;
    return sum + plan.count;
  }, 0);

  // 料金選択に基づいて単価を決定
  const additionalPetFee = feeSelection === '旧料金' ? OLD_ADDITIONAL_PET_FEE : NEW_ADDITIONAL_PET_FEE;
  const keyHandlingFee = feeSelection === '旧料金' ? OLD_KEY_HANDLING_FEE : NEW_KEY_HANDLING_FEE;

  // 多頭オプションの合計金額を計算
  const multiPetTotal = multiPet.additionalPets * totalPlanCount * additionalPetFee;

  // 鍵の受取・返却オプションの合計金額を計算
  const keyHandlingTotal = keyHandling.count * keyHandlingFee;

  // 表示用の料金テキスト
  const additionalPetFeeText = formatCurrency(additionalPetFee);
  const keyHandlingFeeText = formatCurrency(keyHandlingFee);

  return (
    <Accordion title="課税オプション" defaultOpen={true}>
      <div className="space-y-4">
        {/* 多頭オプション */}
        <div className="p-4 border rounded-md bg-gray-50">
          <h3 className="text-sm font-medium mb-3">多頭オプション（1頭あたり{additionalPetFeeText}）</h3>
          <div className="space-y-3">
            <NumberInput
              id="multiPet"
              value={multiPet.additionalPets}
              min={0}
              max={3}
              step={1}
              label="追加頭数（1〜3頭）"
              error={(errors.multiPet as MultiPetErrors)?.additionalPets?.message}
              onChange={(value) => setMultiPet(value)}
              register={register('multiPet.additionalPets', {
                min: { value: 0, message: '0以上で入力してください' },
                max: { value: 3, message: '最大3頭までです' },
                valueAsNumber: true,
              })}
            />
            {multiPet.additionalPets > 0 && (
              <div className="text-right text-sm font-medium">
                小計: {formatCurrency(multiPetTotal)} (税抜)
              </div>
            )}
          </div>
        </div>


        {/* 鍵の受取・返却オプション */}
        <div className="p-4 border rounded-md bg-gray-50">
          <h3 className="text-sm font-medium mb-3">鍵の受取・返却（直接）（1回あたり{keyHandlingFeeText}）</h3>
          <div className="space-y-3">
            <NumberInput
              id="keyHandling"
              value={keyHandling.count}
              min={0}
              step={1}
              label="回数"
              error={(errors.keyHandling as KeyHandlingErrors)?.count?.message}
              onChange={(value) => setKeyHandling(value)}
              register={register('keyHandling.count', {
                min: { value: 0, message: '0以上で入力してください' },
                valueAsNumber: true,
              })}
            />
            {keyHandling.count > 0 && (
              <div className="text-right text-sm font-medium">
                小計: {formatCurrency(keyHandlingTotal)} (税抜)
              </div>
            )}
          </div>
        </div>

        {/* その他課税オプション（動的追加） */}
        {taxableOptions.map((option, index) => (
          <div key={option.id} className="p-4 border rounded-md bg-gray-50">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium">その他オプション {index + 1}</h3>
              <button
                type="button"
                className="text-red-500 hover:text-red-700"
                onClick={() => removeTaxableOption(option.id)}
              >
                削除
              </button>
            </div>

            <div className="space-y-3">
              {/* オプション名 */}
              <div>
                <label htmlFor={`option-name-${option.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                  オプション名 <span className="text-red-500">*</span>
                </label>
                <input
                  id={`option-name-${option.id}`}
                  type="text"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register(`taxableOptions[${index}].name` as FieldPath<FormValues>, {
                    required: 'オプション名は必須です',
                    onChange: (e) => updateTaxableOption(option.id, { name: e.target.value })
                  })}
                  defaultValue={option.name}
                />
                {errors.taxableOptions?.[index]?.name && (
                  <p className="mt-1 text-sm text-red-600">
                    {(errors.taxableOptions as Record<number, { name?: { message?: string } }>)[index]?.name?.message}
                  </p>
                )}
              </div>

              {/* 回数 */}
              <NumberInput
                id={`option-count-${option.id}`}
                value={option.count}
                min={1}
                label="回数"
                required={true}
                error={errors.taxableOptions?.[index]?.count?.message as string}
                onChange={(value) => updateTaxableOption(option.id, { count: value })}
                register={register(`taxableOptions[${index}].count` as FieldPath<FormValues>, {
                  required: '回数は必須です',
                  min: { value: 1, message: '回数は1以上で入力してください' },
                  valueAsNumber: true,
                })}
              />

              {/* 単価 */}
              <NumberInput
                id={`option-price-${option.id}`}
                value={option.unitPrice}
                min={0}
                step={100}
                label="単価（税抜）"
                required={true}
                error={errors.taxableOptions?.[index]?.unitPrice?.message as string}
                onChange={(value) => updateTaxableOption(option.id, { unitPrice: value })}
                register={register(`taxableOptions[${index}].unitPrice` as FieldPath<FormValues>, {
                  required: '単価は必須です',
                  min: { value: 0, message: '単価は0以上で入力してください' },
                  valueAsNumber: true,
                })}
              />

              {/* 小計表示 */}
              {option.name && option.count > 0 && option.unitPrice > 0 && (
                <div className="text-right text-sm font-medium">
                  小計: {formatCurrency(option.unitPrice * option.count)} (税抜)
                </div>
              )}
            </div>
          </div>
        ))}

        <button
          type="button"
          className="w-full py-2 px-4 border border-blue-500 text-blue-500 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          onClick={addTaxableOption}
        >
          + その他オプションを追加
        </button>
      </div>
    </Accordion>
  );
}