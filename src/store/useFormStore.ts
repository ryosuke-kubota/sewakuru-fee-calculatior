'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import dayjs from 'dayjs';
import {
  OLD_ADDITIONAL_PET_FEE,
  NEW_ADDITIONAL_PET_FEE,
  OLD_KEY_HANDLING_FEE,
  NEW_KEY_HANDLING_FEE,
  OLD_COUNSELING_FEES,
  NEW_COUNSELING_FEES,
  OLD_SEWAKURU_TRANSPORTATION_FEE,
  NEW_SEWAKURU_TRANSPORTATION_FEE,
  OLD_TOKYU_TRANSPORTATION_FEE,
  NEW_TOKYU_TRANSPORTATION_FEE,
  calculateSurchargeRate,
  applyCancel
} from '@/utils/feeCalculator';

// 料金タイプの定義
export type FeeType = '通常' | 'キャンセル30%' | 'キャンセル50%' | 'キャンセル100%';

// 料金選択の定義
export type FeeSelection = '旧料金' | '新料金';

// アライアンスの定義
export type Alliance = 'セワクル' | '東急';

// カウンセリングの定義
export type Counseling = '無料' | '有料' | 'なし';

// 割増の定義
export type Surcharge = '時間外' | 'ハイシーズン' | 'ミドルシーズン' | 'トップシーズン';

// プランの定義
export interface Plan {
  id: string;
  name: string;
  count: number;
  unitPrice: number;
  surcharges: Surcharge[];
}

// 課税オプションの定義
export interface TaxableOption {
  id: string;
  name: string;
  count: number;
  unitPrice: number;
}

// 非課税オプションの定義
export interface NonTaxableOption {
  id: string;
  name: string;
  count: number;
  unitPrice: number;
}

// 多頭オプションの定義
export interface MultiPetOption {
  additionalPets: number; // 1-3
}

// 15分延長オプションの定義
export interface ExtensionOption {
  count: number;
}

// 鍵の受取・返却オプションの定義
export interface KeyHandlingOption {
  count: number;
}

// フォームの状態の定義
export interface FormState {
  // 基本情報
  customerName: string;
  sitterName: string;
  sittingDateTime: string;
  feeType: FeeType;
  feeSelection: FeeSelection;
  alliance: Alliance;
  counseling: Counseling;
  surcharges: Surcharge[];

  // プラン
  plans: Plan[];

  // オプション（課税）
  multiPet: MultiPetOption;
  extension: ExtensionOption;
  keyHandling: KeyHandlingOption;
  taxableOptions: TaxableOption[];

  // オプション（非課税）
  transportationFee: {
    count: number;
    unitPrice: number;
  };
  nonTaxableOptions: NonTaxableOption[];

  // 計算結果
  calculationResult: {
    subtotalTaxExcluded: number;
    counselingFee: number; // カウンセリング料金を別途保持
    tax: number;
    subtotalTaxIncluded: number;
    nonTaxableTotal: number;
    grandTotal: number;
  } | null;
}

// アクション定義
interface FormActions {
  // 基本情報の更新
  setCustomerName: (name: string) => void;
  setSitterName: (name: string) => void;
  setSittingDateTime: (dateTime: string) => void;
  setFeeType: (type: FeeType) => void;
  setFeeSelection: (selection: FeeSelection) => void;
  setAlliance: (alliance: Alliance) => void;
  setCounseling: (counseling: Counseling) => void;
  toggleSurcharge: (surcharge: Surcharge) => void;

  // プラン操作
  addPlan: () => void;
  updatePlan: (id: string, plan: Partial<Plan>) => void;
  removePlan: (id: string) => void;

  // 多頭オプション
  setMultiPet: (additionalPets: number) => void;

  // 15分延長オプション
  setExtension: (count: number) => void;

  // 鍵の受取・返却オプション
  setKeyHandling: (count: number) => void;

  // 課税オプション操作
  addTaxableOption: () => void;
  updateTaxableOption: (id: string, option: Partial<TaxableOption>) => void;
  removeTaxableOption: (id: string) => void;

  // 交通費設定
  setTransportationFee: (count: number) => void;

  // 非課税オプション操作
  addNonTaxableOption: () => void;
  updateNonTaxableOption: (id: string, option: Partial<NonTaxableOption>) => void;
  removeNonTaxableOption: (id: string) => void;

  // 計算実行
  calculateFees: () => void;

  // フォームリセット
  resetForm: () => void;
}

// 初期状態
// クライアントサイドでのみ実行される初期状態
const getInitialState = (): FormState => ({
  customerName: '',
  sitterName: '',
  sittingDateTime: dayjs().format('YYYY-MM-DDTHH:mm'),
  feeType: '通常',
  feeSelection: '旧料金',
  alliance: 'セワクル',
  counseling: 'なし',
  surcharges: [],

  plans: [],

  multiPet: {
    additionalPets: 0,
  },
  extension: {
    count: 0,
  },
  keyHandling: {
    count: 0,
  },
  taxableOptions: [],

  transportationFee: {
    count: 0, // バリデーションエラーを防ぐために0に設定
    unitPrice: OLD_SEWAKURU_TRANSPORTATION_FEE, // デフォルトはセワクル出張費（旧料金）
  },
  nonTaxableOptions: [
    {
      id: 'nontaxable-transportation', // 出張費も非課税オプションとして扱う
      name: '出張費',
      count: 0, // バリデーションエラーを防ぐために0に設定
      unitPrice: OLD_SEWAKURU_TRANSPORTATION_FEE, // デフォルトはセワクル出張費（旧料金）
    },
    {
      id: 'nontaxable-parking',
      name: '駐車料金',
      count: 0,
      unitPrice: 0,
    },
    {
      id: 'nontaxable-public-transport',
      name: '公共交通機関',
      count: 0,
      unitPrice: 0,
    },
    {
      id: 'nontaxable-key-shipping',
      name: '鍵郵送代',
      count: 0,
      unitPrice: 0,
    },
  ],

  calculationResult: null,
})

// ストア作成
export const useFormStore = create<FormState & FormActions>()(
  persist(
    (set, get) => ({
      ...getInitialState(),

      // 基本情報の更新
      setCustomerName: (name) => set({ customerName: name }),
      setSitterName: (name) => set({ sitterName: name }),
      setSittingDateTime: (dateTime) => set({ sittingDateTime: dateTime }),
      setFeeType: (type) => set({ feeType: type }),
      setFeeSelection: (selection) => {
        // 現在の状態を取得
        const currentState = get();
        const alliance = currentState.alliance;
        
        // 料金選択とアライアンスに基づいて出張費を設定
        let transportationFeeUnitPrice;
        if (alliance === 'セワクル') {
          transportationFeeUnitPrice = selection === '旧料金' ? OLD_SEWAKURU_TRANSPORTATION_FEE : NEW_SEWAKURU_TRANSPORTATION_FEE;
        } else {
          transportationFeeUnitPrice = selection === '旧料金' ? OLD_TOKYU_TRANSPORTATION_FEE : NEW_TOKYU_TRANSPORTATION_FEE;
        }
        
        // 出張費の非課税オプションを更新
        const updatedNonTaxableOptions = currentState.nonTaxableOptions.map(option =>
          option.id === 'nontaxable-transportation'
            ? { ...option, unitPrice: transportationFeeUnitPrice }
            : option
        );
        
        // 状態を更新
        set({
          feeSelection: selection,
          transportationFee: {
            ...currentState.transportationFee,
            unitPrice: transportationFeeUnitPrice
          },
          nonTaxableOptions: updatedNonTaxableOptions
        });
      },
      setAlliance: (alliance) => {
        // 現在の状態を取得
        const currentState = get();
        const feeSelection = currentState.feeSelection;
        
        // 料金選択とアライアンスに基づいて出張費を設定
        let transportationFeeUnitPrice;
        if (alliance === 'セワクル') {
          transportationFeeUnitPrice = feeSelection === '旧料金' ? OLD_SEWAKURU_TRANSPORTATION_FEE : NEW_SEWAKURU_TRANSPORTATION_FEE;
        } else {
          transportationFeeUnitPrice = feeSelection === '旧料金' ? OLD_TOKYU_TRANSPORTATION_FEE : NEW_TOKYU_TRANSPORTATION_FEE;
        }
        
        // 出張費の非課税オプションを更新
        const updatedNonTaxableOptions = currentState.nonTaxableOptions.map(option =>
          option.id === 'nontaxable-transportation'
            ? { ...option, unitPrice: transportationFeeUnitPrice }
            : option
        );
        
        // 状態を更新
        set({
          alliance: alliance,
          transportationFee: {
            ...currentState.transportationFee,
            unitPrice: transportationFeeUnitPrice
          },
          nonTaxableOptions: updatedNonTaxableOptions
        });
      },
      setCounseling: (counseling) => {
        // 状態を更新
        set({
          counseling: counseling
        });
      },
      toggleSurcharge: (surcharge) => {
        const currentSurcharges = get().surcharges;
        const exists = currentSurcharges.includes(surcharge);
        
        if (exists) {
          set({ surcharges: currentSurcharges.filter(s => s !== surcharge) });
        } else {
          set({ surcharges: [...currentSurcharges, surcharge] });
        }
      },

      // プラン操作
      addPlan: () => {
        const currentPlans = get().plans;
        if (currentPlans.length >= 100) return; // 最大3枠まで
        
        set({
          plans: [
            ...currentPlans,
            {
              id: `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: '',
              count: 1,
              unitPrice: 0,
              surcharges: [],
            },
          ],
        });
      },
      updatePlan: (id, plan) => {
        const currentPlans = get().plans;
        set({
          plans: currentPlans.map(p => {
            if (p.id === id) {
              // 更新前に、surchargesが存在しない場合は空の配列を設定
              const updatedPlan = { ...p, ...plan };
              
              // surchargesが未定義の場合は空の配列を設定
              if (updatedPlan.surcharges === undefined) {
                updatedPlan.surcharges = [];
              }
              
              return updatedPlan;
            }
            return p;
          }),
        });
      },
      removePlan: (id) => {
        const currentPlans = get().plans;
        // if (currentPlans.length <= 1) return; // 最低1つは必要
        
        set({
          plans: currentPlans.filter(p => p.id !== id),
        });
      },

      // 多頭オプション
      setMultiPet: (additionalPets) => set({
        multiPet: { additionalPets: Math.min(Math.max(0, additionalPets), 3) }
      }),

      // 15分延長オプション
      setExtension: (count) => set({
        extension: { count: Math.max(0, count) }
      }),

      // 鍵の受取・返却オプション
      setKeyHandling: (count) => set({
        keyHandling: { count: Math.max(0, count) }
      }),

      // 課税オプション操作
      addTaxableOption: () => {
        const currentOptions = get().taxableOptions;
        set({
          taxableOptions: [
            ...currentOptions,
            {
              id: `taxable-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: '',
              count: 1,
              unitPrice: 0,
            },
          ],
        });
      },
      updateTaxableOption: (id, option) => {
        const currentOptions = get().taxableOptions;
        set({
          taxableOptions: currentOptions.map(o => 
            o.id === id ? { ...o, ...option } : o
          ),
        });
      },
      removeTaxableOption: (id) => {
        const currentOptions = get().taxableOptions;
        set({
          taxableOptions: currentOptions.filter(o => o.id !== id),
        });
      },

      // 交通費設定（互換性のために残す）
      setTransportationFee: (count) => set((state) => {
        // transportationFeeの状態を更新
        const newState = {
          transportationFee: {
            count: Math.max(0, count),
            unitPrice: state.transportationFee.unitPrice
          }
        };
        
        // 対応する非課税オプションも更新
        const currentOptions = state.nonTaxableOptions;
        const updatedOptions = currentOptions.map(o =>
          o.id === 'nontaxable-transportation'
            ? { ...o, count: Math.max(0, count) }
            : o
        );
        
        return {
          ...newState,
          nonTaxableOptions: updatedOptions
        };
      }),

      // 非課税オプション操作
      addNonTaxableOption: () => {
        const currentOptions = get().nonTaxableOptions;
        console.log('ののん', currentOptions)
        set({
          nonTaxableOptions: [
            ...currentOptions,
            {
              id: `nontaxable-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: '',
              count: 1,
              unitPrice: 0,
            },
          ],
        });
      },
      updateNonTaxableOption: (id, option) => {
        const currentOptions = get().nonTaxableOptions;
        set({
          nonTaxableOptions: currentOptions.map(o => 
            o.id === id ? { ...o, ...option } : o
          ),
        });
      },
      removeNonTaxableOption: (id) => {
        const currentOptions = get().nonTaxableOptions;
        set({
          nonTaxableOptions: currentOptions.filter(o => o.id !== id),
        });
      },

      // 計算実行
      calculateFees: () => {
        const state = get();
        
        // 定数
        const TAX_RATE = 0.10;
        
        // 基本料金（プラン）の計算 - 各プランごとに割増を適用
        let subtotalTaxExcluded = state.plans.reduce((sum, plan) => {
          // unitPriceとcountが有効な値であることを確認
          const unitPrice = plan.unitPrice || 0;
          const count = plan.count || 0;
          let planFee = unitPrice * count;
          
          // プランごとの割増の適用
          // surchargesが存在することを確認
          if (plan.surcharges && Array.isArray(plan.surcharges) && plan.surcharges.length > 0) {
            // 新しい割増率計算関数を使用（アライアンス情報を渡す）
            const surchargeRate = calculateSurchargeRate(plan.surcharges, state.alliance);
            planFee = planFee * surchargeRate;
          }
          
          return sum + planFee;
        }, 0);
        
        // カウンセリング料金（無料、有料、なし）- 別途計算（アライアンス別・料金選択別）
        const counselingFee = state.counseling === 'なし' ? 0 :
          state.feeSelection === '旧料金' ?
            OLD_COUNSELING_FEES[state.alliance][state.counseling] :
            NEW_COUNSELING_FEES[state.alliance][state.counseling];
        // カウンセリング料金はsubtotalTaxExcludedに含めない
        
        // 多頭料金の計算
        // 15分延長以外のプランの合計数を計算
        const totalPlanCount = state.plans.reduce((sum, plan) => {
          // 15分延長プランは除外
          if (plan.name === '15分延長') return sum;
          return sum + plan.count;
        }, 0);
        // 料金選択に基づいて多頭料金を決定
        const additionalPetFee = state.feeSelection === '旧料金' ? OLD_ADDITIONAL_PET_FEE : NEW_ADDITIONAL_PET_FEE;
        // totalPlanCountが0の場合は0を設定（NaN防止）
        const multiPetFee = totalPlanCount === 0 ? 0 : state.multiPet.additionalPets * totalPlanCount * additionalPetFee;
        subtotalTaxExcluded += multiPetFee;
        
        // 15分延長料金の計算 - プランの割増を適用
        let extensionFee = state.extension.count * 600;
        
        // 最初のプランの割増を15分延長オプションにも適用
        // surchargesが存在し、長さが0より大きいことを確認（NaN防止）
        if (state.plans.length > 0 && state.plans[0].surcharges && state.plans[0].surcharges.length > 0) {
          const firstPlan = state.plans[0];
          // 新しい割増率計算関数を使用（アライアンス情報を渡す）
          const surchargeRate = calculateSurchargeRate(firstPlan.surcharges, state.alliance);
          extensionFee = extensionFee * surchargeRate;
        }
        
        subtotalTaxExcluded += extensionFee;
        
        // 鍵の受取・返却料金の計算
        // 料金選択に基づいて鍵の受取・返却料金を決定
        const keyHandlingUnitFee = state.feeSelection === '旧料金' ? OLD_KEY_HANDLING_FEE : NEW_KEY_HANDLING_FEE;
        const keyHandlingFee = state.keyHandling.count * keyHandlingUnitFee;
        subtotalTaxExcluded += keyHandlingFee;
        
        // その他課税オプションの計算
        const otherTaxableFees = state.taxableOptions.reduce((sum, option) => {
          // unitPriceとcountが有効な値であることを確認
          const unitPrice = option.unitPrice || 0;
          const count = option.count || 0;
          return sum + (unitPrice * count);
        }, 0);
        subtotalTaxExcluded += otherTaxableFees;
        
        // 消費税の計算
        const tax = Math.floor(subtotalTaxExcluded * TAX_RATE);
        // 税込小計（使用しないが、将来的に必要になる可能性があるため計算）
        // const subtotalTaxIncluded = subtotalTaxExcluded + tax;
        
        // 非課税項目の計算
        // すべての非課税オプション（出張費を含む）
        const nonTaxableTotal = state.nonTaxableOptions.reduce((sum, option) => {
          // unitPriceとcountが有効な値であることを確認
          const unitPrice = option.unitPrice || 0;
          const count = option.count || 0;
          return sum + (unitPrice * count);
        }, 0);
        
        // キャンセル係数の適用
        // applyCancel関数を使用してキャンセル係数を適用
        const adjustedSubtotal = applyCancel(Number(subtotalTaxExcluded || 0), state.feeType);
        const adjustedTax = applyCancel(Number(tax || 0), state.feeType);
        const adjustedNonTaxable = applyCancel(Number(nonTaxableTotal || 0), state.feeType);
        
        // カウンセリング料金にもキャンセル係数を適用
        const adjustedCounselingFee = applyCancel(Number(counselingFee || 0), state.feeType);
        
        // 合計金額の計算（カウンセリング料金を含める）
        const grandTotal = adjustedSubtotal + adjustedTax + adjustedNonTaxable + adjustedCounselingFee;
        
        // 結果を設定
        set({
          calculationResult: {
            subtotalTaxExcluded: adjustedSubtotal,
            counselingFee: adjustedCounselingFee,
            tax: adjustedTax,
            subtotalTaxIncluded: adjustedSubtotal + adjustedTax,
            nonTaxableTotal: adjustedNonTaxable,
            grandTotal: grandTotal,
          },
        });
      },

      // フォームリセット
      resetForm: () => set({ ...getInitialState() }),
    }),
    {
      name: 'sewakuru-form-storage',
    }
  )
);