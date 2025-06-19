'use client';

import { useFormContext } from 'react-hook-form';
import { Accordion } from '@/components/ui/Accordion';
import { useFormStore, FeeType, FeeSelection, Alliance, Counseling } from '@/store/useFormStore';

export function BasicInfoSection() {
  const { register, formState: { errors } } = useFormContext();
  
  const {
    feeType,
    feeSelection,
    alliance,
    counseling,
    setCustomerName,
    setSitterName,
    setSittingDateTime,
    setFeeType,
    setFeeSelection,
    setAlliance,
    setCounseling,
  } = useFormStore();

  return (
    <Accordion title="基本情報" defaultOpen={true}>
      <div className="space-y-4">
        {/* お客様名 */}
        <div>
          <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
            お客様名 <span className="text-red-500">*</span>
          </label>
          <input
            id="customerName"
            type="text"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.customerName ? 'border-red-500' : ''
            }`}
            {...register('customerName', {
              required: 'お客様名は必須です',
              onChange: (e) => setCustomerName(e.target.value)
            })}
            aria-invalid={errors.customerName ? "true" : "false"}
          />
          {errors.customerName && (
            <p className="mt-1 text-sm text-red-600">{errors.customerName.message as string}</p>
          )}
        </div>

        {/* 担当シッター名 */}
        <div>
          <label htmlFor="sitterName" className="block text-sm font-medium text-gray-700 mb-1">
            担当シッター名 <span className="text-red-500">*</span>
          </label>
          <input
            id="sitterName"
            type="text"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.sitterName ? 'border-red-500' : ''
            }`}
            {...register('sitterName', {
              required: '担当シッター名は必須です',
              onChange: (e) => setSitterName(e.target.value)
            })}
            aria-invalid={errors.sitterName ? "true" : "false"}
          />
          {errors.sitterName && (
            <p className="mt-1 text-sm text-red-600">{errors.sitterName.message as string}</p>
          )}
        </div>

        {/* シッティング日時 */}
        <div>
          <label htmlFor="sittingDateTime" className="block text-sm font-medium text-gray-700 mb-1">
            シッティング日時 <span className="text-red-500">*</span>
          </label>
          <input
            id="sittingDateTime"
            type="datetime-local"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.sittingDateTime ? 'border-red-500' : ''
            }`}
            {...register('sittingDateTime', {
              required: 'シッティング日時は必須です',
              onChange: (e) => {
                // 日付フォーマットをそのまま使用
                setSittingDateTime(e.target.value);
              }
            })}
            aria-invalid={errors.sittingDateTime ? "true" : "false"}
          />
          {errors.sittingDateTime && (
            <p className="mt-1 text-sm text-red-600">{errors.sittingDateTime.message as string}</p>
          )}
        </div>

        {/* 料金タイプ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">料金タイプ</label>
          <div className="flex space-x-2">
            {(['通常', 'キャンセル30%', 'キャンセル50%', 'キャンセル100%'] as FeeType[]).map((type) => (
              <label key={type} className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio h-4 w-4 text-blue-600"
                  checked={feeType === type}
                  onChange={() => setFeeType(type)}
                  value={type}
                  name="feeType"
                />
                <span className="ml-1 text-sm whitespace-nowrap">{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 料金選択 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">料金選択</label>
          <div className="flex space-x-4">
            {(['旧料金', '新料金'] as FeeSelection[]).map((selection) => (
              <label key={selection} className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio h-4 w-4 text-blue-600"
                  checked={feeSelection === selection}
                  onChange={() => setFeeSelection(selection)}
                  value={selection}
                  name="feeSelection"
                />
                <span className="ml-1 text-sm whitespace-nowrap">{selection}{selection === '新料金' && ' (2025年7月〜)'}</span>
              </label>
            ))}
          </div>
        </div>

        {/* アライアンス選択 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">アライアンス選択</label>
          <div className="flex space-x-4">
            {(['セワクル', '東急'] as Alliance[]).map((allianceOption) => (
              <label key={allianceOption} className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio h-4 w-4 text-blue-600"
                  checked={alliance === allianceOption}
                  onChange={() => setAlliance(allianceOption)}
                  value={allianceOption}
                  name="alliance"
                />
                <span className="ml-1 text-sm whitespace-nowrap">{allianceOption}</span>
              </label>
            ))}
          </div>
        </div>

        {/* カウンセリング */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">カウンセリング</label>
          <div className="flex space-x-4">
            {(['無料', '有料', 'なし'] as Counseling[]).map((counselingOption) => (
              <label key={counselingOption} className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio h-4 w-4 text-blue-600"
                  checked={counseling === counselingOption}
                  onChange={() => setCounseling(counselingOption)}
                  value={counselingOption}
                  name="counseling"
                />
                <span className="ml-1 text-sm whitespace-nowrap">{counselingOption}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </Accordion>
  );
}