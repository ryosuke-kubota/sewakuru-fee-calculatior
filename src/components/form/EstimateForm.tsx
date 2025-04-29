'use client';

import { useRef, useEffect } from 'react';
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
      id: z.string(),
      name: z.string().min(1, 'プラン名は必須です'),
      count: z.number().min(1, '回数は1以上で入力してください'),
      unitPrice: z.number().min(0, '単価は0以上で入力してください'),
      surcharges: z.array(z.enum(['シーズン', '時間外'])),
    })
  ),
  multiPet: z.object({
    additionalPets: z.number().min(0, '0以上で入力してください').max(3, '最大3頭までです')
  }),
  extension: z.object({
    count: z.number().min(0, '0以上で入力してください')
  }),
  keyHandling: z.object({
    count: z.number().min(0, '0以上で入力してください')
  }),
  taxableOptions: z.array(
    z.object({
      id: z.string(),
      name: z.string().min(1, 'オプション名は必須です'),
      count: z.number().min(1, '回数は1以上で入力してください'),
      unitPrice: z.number().min(0, '単価は0以上で入力してください'),
    })
  ),
  nonTaxableOptions: z.array(
    z.object({
      id: z.string(),
      name: z.string().min(1, 'オプション名は必須です'),
      count: z.number().min(0, '回数は0以上で入力してください'),
      unitPrice: z.number().min(0, '単価は0以上で入力してください'),
    })
  ),
});

// 必須フィールドを明示的に指定した型
type FormValues = {
  customerName: string;
  sitterName: string;
  sittingDateTime: string;
  feeType: '通常' | 'キャンセル50%' | 'キャンセル100%';
  feeSelection: '旧料金' | '新料金';
  alliance: 'セワクル' | '東急';
  counseling: '無料' | '有料';
  surcharges: ('シーズン' | '時間外')[];
  plans: {
    id: string;
    name: string;
    count: number;
    unitPrice: number;
    surcharges: ('シーズン' | '時間外')[];
  }[];
  multiPet: {
    additionalPets: number;
  };
  extension: {
    count: number;
  };
  keyHandling: {
    count: number;
  };
  taxableOptions: {
    id: string;
    name: string;
    count: number;
    unitPrice: number;
  }[];
  nonTaxableOptions: {
    id: string;
    name: string;
    count: number;
    unitPrice: number;
  }[];
};

// 固定非課税オプションの定義（NonTaxableOptionsSectionと同じ定義）
const FIXED_OPTIONS = [
  { id: 'nontaxable-transportation', name: '出張費', registerPrefix: 'transportationFee' },
  { id: 'nontaxable-parking', name: '駐車料金', registerPrefix: 'parking' },
  { id: 'nontaxable-public-transport', name: '公共交通機関', registerPrefix: 'publicTransport' },
  { id: 'nontaxable-key-shipping', name: '鍵郵送代', registerPrefix: 'keyShipping' },
];

export function EstimateForm() {
  const resultRef = useRef<HTMLDivElement>(null);
  const { calculateFees, alliance, plans, nonTaxableOptions } = useFormStore();

  // アライアンスに応じたカラークラスを設定
  const colorClasses = alliance === 'セワクル'
    ? { primary: 'bg-sewakuru-primary', text: 'text-sewakuru-primary' }
    : { primary: 'bg-tokyu-primary', text: 'text-tokyu-primary' };

  // React Hook Formの設定
  const methods = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
  });
  
  // コンポーネントマウント時に初期値を設定
  useEffect(() => {
    // 初期値を設定
    methods.setValue('feeType', '通常');
    methods.setValue('feeSelection', '旧料金');
    methods.setValue('alliance', 'セワクル');
    methods.setValue('counseling', '無料');
    methods.setValue('surcharges', []);
    methods.setValue('multiPet', { additionalPets: 0 });
    methods.setValue('extension', { count: 0 });
    methods.setValue('keyHandling', { count: 0 });
    methods.setValue('taxableOptions', []);
  }, [methods]);

  // フォームの状態が変更されたときに値を設定
  useEffect(() => {
    // フォームの値を設定
    methods.setValue('plans', plans);
    methods.setValue('nonTaxableOptions', nonTaxableOptions);
    
    // フォームが送信された後のみバリデーションを実行
    if (methods.formState.isSubmitted) {
      methods.trigger();
    }
  }, [methods, plans, nonTaxableOptions]);

  // フォーム送信処理
  const onSubmit = async () => {
    // フォームのバリデーションを実行
    const result = await methods.trigger();
    
    // バリデーションエラーがある場合
    if (!result) {
      // エラーがあるフィールドを取得
      const errors = methods.formState.errors;
      console.log('バリデーションエラー:', errors);
      
      // エラーメッセージを構築
      const errorMessages: string[] = [];
      
      // 基本情報のエラー
      if (errors.customerName) errorMessages.push(`お客様名: ${errors.customerName.message}`);
      if (errors.sitterName) errorMessages.push(`担当シッター名: ${errors.sitterName.message}`);
      if (errors.sittingDateTime) errorMessages.push(`シッティング日時: ${errors.sittingDateTime.message}`);
      
      // プランのエラー
      if (errors.plans) {
        const plansErrors = errors.plans as Record<string, {
          name?: { message?: string },
          count?: { message?: string },
          unitPrice?: { message?: string }
        }>;
        
        Object.keys(plansErrors).forEach(index => {
          const planError = plansErrors[index];
          if (planError.name) errorMessages.push(`プラン${Number(index) + 1}のプラン名: ${planError.name.message}`);
          if (planError.count) errorMessages.push(`プラン${Number(index) + 1}の回数: ${planError.count.message}`);
          if (planError.unitPrice) errorMessages.push(`プラン${Number(index) + 1}の単価: ${planError.unitPrice.message}`);
        });
      }
      
      // 非課税オプションのエラー
      if (errors.nonTaxableOptions) {
        const optionsErrors = errors.nonTaxableOptions as Record<string, {
          name?: { message?: string },
          count?: { message?: string },
          unitPrice?: { message?: string }
        }>;
        
        Object.keys(optionsErrors).forEach(index => {
          const optionError = optionsErrors[index];
          const optionName = Number(index) < 4
            ? FIXED_OPTIONS[Number(index)].name
            : `その他非課税オプション${Number(index) - 3}`;
            
          if (optionError.name) errorMessages.push(`${optionName}の名前: ${optionError.name.message}`);
          if (optionError.count) errorMessages.push(`${optionName}の回数: ${optionError.count.message}`);
          if (optionError.unitPrice) errorMessages.push(`${optionName}の単価: ${optionError.unitPrice.message}`);
        });
      }
      
      // エラーがある最初のフィールドを見つける
      const firstErrorField = Object.keys(errors)[0];
      
      // エラーがあるフィールドにスクロール
      const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // フォーカスを設定
        (errorElement as HTMLElement).focus();
      }
      
      return;
    }
    
    // バリデーションが成功した場合、計算実行
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