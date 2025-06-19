'use client';

import { useFormContext } from 'react-hook-form';
import { Accordion } from '@/components/ui/Accordion';
import { useFormStore, Surcharge } from '@/store/useFormStore';
import { OLD_FEE_PLANS, NEW_FEE_PLANS, calculateSurchargeRate } from '@/utils/feeCalculator';
import { formatCurrency } from '@/utils/feeCalculator';
import { useEffect } from 'react';
import { NumberInput } from '@/components/ui/NumberInput';

type PlanFormData = {
  plans: {
    name?: string;
    count?: number;
  }[];
};

export function PlanSection() {
  const { register, formState: { errors } } = useFormContext<PlanFormData>();
  
  const {
    plans,
    feeSelection,
    alliance,
    addPlan,
    updatePlan,
    removePlan,
  } = useFormStore();

  // 料金プランの選択肢を取得
  const planOptions = feeSelection === '旧料金' ? OLD_FEE_PLANS : NEW_FEE_PLANS;

  // アライアンス変更時にセワくるで利用できないシーズンをクリア
  useEffect(() => {
    if (alliance === 'セワクル') {
      plans.forEach(plan => {
        if (plan.surcharges && (plan.surcharges.includes('ミドルシーズン') || plan.surcharges.includes('トップシーズン'))) {
          const filteredSurcharges = plan.surcharges.filter(s =>
            s !== 'ミドルシーズン' && s !== 'トップシーズン'
          ) as Surcharge[];
          updatePlan(plan.id, { surcharges: filteredSurcharges });
        }
      });
    }
  }, [alliance, plans, updatePlan]);
  const planNames = Object.keys(planOptions);

  // コンポーネントがマウントされたとき、または料金選択が変更されたときに
  // 既存のプラン名に対応する単価を設定する
  useEffect(() => {
    plans.forEach(plan => {
      if (plan.name && planOptions[plan.name as keyof typeof planOptions]) {
        const unitPrice = planOptions[plan.name as keyof typeof planOptions];
        if (plan.unitPrice !== unitPrice) {
          console.log(`単価を更新: ${plan.name}, ${plan.unitPrice} → ${unitPrice}`);
          updatePlan(plan.id, { unitPrice });
        }
      }
    });
  }, [feeSelection, plans, planOptions, updatePlan]);

  // プラン名が変更されたときの処理
  const handlePlanNameChange = (id: string, name: string) => {
    // 選択されたプラン名に対応する単価を取得
    const unitPrice = planOptions[name as keyof typeof planOptions] || 0;
    console.log(`プラン名変更: ${name}, 単価: ${unitPrice}`);
    
    // プランの更新（名前と単価を同時に更新）
    updatePlan(id, { name, unitPrice });
    
    // 単価が正しく設定されたか確認
    setTimeout(() => {
      const updatedPlan = plans.find(p => p.id === id);
      console.log(`更新後のプラン: ${updatedPlan?.name}, 単価: ${updatedPlan?.unitPrice}`);
    }, 100);
  };

  // 割増オプションの選択状態を確認
  const isSurchargeSelected = (plan: { surcharges: Surcharge[] }, surcharge: Surcharge) => {
    console.log('isSurchargeSelected', plan, surcharge);
    return Array.isArray(plan.surcharges) && plan.surcharges.includes(surcharge);
  };

  // 割増オプションの切り替え
  const handleToggleSurcharge = (planId: string, surcharge: Surcharge) => {
    console.log('handleToggleSurcharge', planId, surcharge);
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;
    
    console.log('現在のsurcharges:', plan.surcharges);
    
    const newSurcharges = Array.isArray(plan.surcharges) ? [...plan.surcharges] : [];
    const index = newSurcharges.indexOf(surcharge);
    
    if (index !== -1) {
      newSurcharges.splice(index, 1);
    } else {
      newSurcharges.push(surcharge);
    }
    
    console.log('新しいsurcharges:', newSurcharges);
    
    updatePlan(planId, { surcharges: newSurcharges });
    
    // 更新後の確認
    setTimeout(() => {
      const updatedPlan = plans.find(p => p.id === planId);
      console.log('更新後のplan:', updatedPlan);
    }, 100);
  };

  // シーズン割増の変更処理（チェックボックス用）
  const handleSeasonToggle = (planId: string, season: Surcharge) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;
    
    const newSurcharges = Array.isArray(plan.surcharges) ? [...plan.surcharges] : [];
    const seasonSurcharges = ['ハイシーズン', 'ミドルシーズン', 'トップシーズン'] as Surcharge[];
    
    // 現在選択されているシーズン割増を取得
    const currentSeasonSurcharges = newSurcharges.filter(s => seasonSurcharges.includes(s));
    
    // 既存のシーズン割増を削除
    const filteredSurcharges = newSurcharges.filter(s => !seasonSurcharges.includes(s));
    
    // 選択されたシーズンが既に選択されている場合は削除、そうでなければ追加
    if (currentSeasonSurcharges.includes(season)) {
      // 既に選択されている場合は削除（チェックを外す）
      // filteredSurchargesには既にシーズン割増が除外されているのでそのまま使用
    } else {
      // 新しいシーズンを追加（最大1つの制限により、他のシーズンは自動的に除外される）
      filteredSurcharges.push(season);
    }
    
    updatePlan(planId, { surcharges: filteredSurcharges });
  };

  return (
    <Accordion title="プラン" defaultOpen={true}>
      <div className="space-y-4">
        {plans.map((plan, index) => (
          <div key={plan.id} className="p-4 border rounded-md bg-gray-50">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium">プラン {index + 1}</h3>
              {plans.length > 0 && (
                <button
                  type="button"
                  className="text-red-500 hover:text-red-700"
                  onClick={() => removePlan(plan.id)}
                >
                  削除
                </button>
              )}
            </div>

            <div className="space-y-3">
              {/* プラン名 */}
              <div>
                <label htmlFor={`plan-name-${plan.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                  プラン名 <span className="text-red-500">*</span>
                </label>
                <select
                  id={`plan-name-${plan.id}`}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.plans?.[index]?.name ? 'border-red-500' : ''
                  }`}
                  {...register(`plans.${index}.name`, {
                    required: 'プラン名は必須です',
                    onChange: (e) => handlePlanNameChange(plan.id, e.target.value)
                  })}
                  value={plan.name}
                  aria-invalid={errors.plans?.[index]?.name ? "true" : "false"}
                >
                  <option value="">プランを選択してください</option>
                  {planNames.map((name) => (
                    <option key={name} value={name}>
                      {name} ({formatCurrency(planOptions[name as keyof typeof planOptions])}/回)
                    </option>
                  ))}
                </select>
                {errors.plans?.[index]?.name && (
                  <p className="mt-1 text-sm text-red-600">{(errors.plans as Record<number, { name?: { message?: string } }>)[index]?.name?.message}</p>
                )}
              </div>

              {/* 回数 */}
              <NumberInput
                id={`plan-count-${plan.id}`}
                value={plan.count}
                min={1}
                step={1}
                label="回数"
                required={true}
                error={errors.plans?.[index]?.count?.message as string}
                onChange={(value) => updatePlan(plan.id, { count: value })}
                register={register(`plans.${index}.count`, {
                  required: '回数は必須です',
                  min: { value: 1, message: '回数は1以上で入力してください' },
                  valueAsNumber: true,
                })}
              />

              {/* 割増オプション */}
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  割増オプション
                </label>
                <div className="space-y-2 my-2">
                  <div className="flex flex-wrap gap-4">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        className="form-checkbox h-4 w-4 text-blue-600"
                        checked={isSurchargeSelected(plan, '時間外')}
                        onChange={() => handleToggleSurcharge(plan.id, '時間外')}
                      />
                      <span className="ml-1 text-sm">時間外 (+20%)</span>
                    </label>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-gray-700">シーズン割増 (最大1つまで選択可能):</div>
                    <div className="flex flex-wrap gap-4">
                      {alliance === '東急' && (
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            className="form-checkbox h-4 w-4 text-blue-600"
                            checked={isSurchargeSelected(plan, 'ミドルシーズン')}
                            onChange={() => handleSeasonToggle(plan.id, 'ミドルシーズン')}
                          />
                          <span className="ml-1 text-sm">ミドルシーズン (+10%)</span>
                        </label>
                      )}
                        
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          className="form-checkbox h-4 w-4 text-blue-600"
                          checked={isSurchargeSelected(plan, 'ハイシーズン')}
                          onChange={() => handleSeasonToggle(plan.id, 'ハイシーズン')}
                          />
                        <span className="ml-1 text-sm">ハイシーズン (+20%)</span>
                      </label>
                      {alliance === '東急' && (
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            className="form-checkbox h-4 w-4 text-blue-600"
                            checked={isSurchargeSelected(plan, 'トップシーズン')}
                            onChange={() => handleSeasonToggle(plan.id, 'トップシーズン')}
                          />
                          <span className="ml-1 text-sm">トップシーズン (+30%)</span>
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 小計表示 - 常に表示 */}
              <div className="mt-4 p-3 bg-gray-100 rounded-md text-right text-sm font-medium">
                {plan.name && plan.count > 0 ? (
                  <>
                    {Array.isArray(plan.surcharges) && plan.surcharges.length > 0 ? (
                      <>
                        <div>基本料金: {formatCurrency(plan.unitPrice * plan.count)} (税抜)</div>
                        <div className="font-bold text-blue-600">
                          割増適用後: {formatCurrency(
                            plan.unitPrice * plan.count * calculateSurchargeRate(plan.surcharges, alliance)
                          )} (税抜)
                        </div>
                      </>
                    ) : (
                      <div>小計: {formatCurrency(plan.unitPrice * plan.count)} (税抜)</div>
                    )}
                  </>
                ) : (
                  <div>プランと回数を選択してください</div>
                )}
              </div>
            </div>
          </div>
        ))}

        {plans.length < 100 && (
          <button
            type="button"
            className="w-full py-2 px-4 border border-blue-500 text-blue-500 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onClick={addPlan}
          >
            + プランを追加
          </button>
        )}
      </div>
    </Accordion>
  );
}