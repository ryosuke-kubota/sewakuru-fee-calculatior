'use client';

import { useRef } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFormStore } from '@/store/useFormStore';
import { BasicInfoSection } from './BasicInfoSection';
import { PlanSection } from './PlanSection';
import { TaxableOptionsSection } from './TaxableOptionsSection';
import { NonTaxableOptionsSection } from './NonTaxableOptionsSection';
import { ResultSection } from './ResultSection';
import { FormSummary } from './FormSummary';
import { CalculateButton } from './CalculateButton';

// バリデーションスキーマ
const formSchema = z.object({
  customerName: z.string().min(1, 'お客様名は必須です'),
  sitterName: z.string().min(1, '担当シッター名は必須です'),
  sittingDateTime: z.string().min(1, 'シッティング日時は必須です'),
  feeType: z.enum(['通常', 'キャンセル50%', 'キャンセル100%']),
  feeSelection: z.enum(['旧料金', '新料金']),
  alliance: z.enum(['セワクル', '東急']),
  counseling: z.enum(['無料', '有料']),
  surcharges: z.array(z.enum(['シーズン', '時間外'])),
  plans: z.array(
    z.object({
      name: z.string().min(1, 'プラン名は必須です'),
      count: z.number().min(1, '回数は1以上で入力してください'),
      unitPrice: z.number().min(0, '単価は0以上で入力してください'),
    })
  ),
  multiPet: z.number().min(0, '0以上で入力してください').max(3, '最大3頭までです'),
  extension: z.number().min(0, '0以上で入力してください'),
  keyHandling: z.number().min(0, '0以上で入力してください'),
  taxableOptions: z.array(
    z.object({
      name: z.string().min(1, 'オプション名は必須です'),
      count: z.number().min(1, '回数は1以上で入力してください'),
      unitPrice: z.number().min(0, '単価は0以上で入力してください'),
    })
  ),
  transportationFee: z.number().min(0, '0以上で入力してください'),
  nonTaxableOptions: z.array(
    z.object({
      name: z.string().min(1, 'オプション名は必須です'),
      count: z.number().min(1, '回数は1以上で入力してください'),
      unitPrice: z.number().min(0, '単価は0以上で入力してください'),
    })
  ),
});

type FormValues = z.infer<typeof formSchema>;

export function EstimateForm() {
  const resultRef = useRef<HTMLDivElement>(null);
  const { calculateFees, alliance } = useFormStore();

  // アライアンスに応じたカラークラスを設定
  const colorClasses = alliance === 'セワクル' 
    ? { primary: 'bg-sewakuru-primary', text: 'text-sewakuru-primary' }
    : { primary: 'bg-tokyu-primary', text: 'text-tokyu-primary' };

  // React Hook Formの設定
  const methods = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
  });

  // フォーム送信処理
  // フォーム送信処理
  const onSubmit = () => {
    // 計算実行
    calculateFees();
    
    // 結果セクションへスクロール
    if (resultRef.current) {
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="max-w-md mx-auto pb-20">
        <h1 className={`text-2xl font-bold mb-6 text-center ${colorClasses.text}`}>
          シッティング見積フォーム
        </h1>

        <BasicInfoSection />
        <PlanSection />
        <TaxableOptionsSection />
        <NonTaxableOptionsSection />

        <div className="mt-16 mb-16 bg-yellow-100 p-8 rounded-lg border-2 border-yellow-400 shadow-xl">
          <CalculateButton onClick={onSubmit} />
        </div>
        
        <div ref={resultRef}>
          <ResultSection />
        </div>

        <FormSummary />
      </form>
    </FormProvider>
  );
}