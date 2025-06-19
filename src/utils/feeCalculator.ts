import { FeeType } from '@/store/useFormStore';

// 定数
export const TAX_RATE = 0.10;
export const SURCHARGE_RATE = 0.20; // 割増率（時間外）

// シーズン別割増率（アライアンス別）
export const SEASON_SURCHARGE_RATES = {
  '東急': {
    'ミドルシーズン': 0.10, // 10%
    'ハイシーズン': 0.20,   // 20%
    'トップシーズン': 0.30, // 30%
  },
  'セワクル': {
    'ハイシーズン': 0.20,   // 20%
    'ミドルシーズン': 0.00, // 0% (設定なし)
    'トップシーズン': 0.00, // 0% (設定なし)
  }
} as const;

// キャンセル係数
export const CANCEL_FACTOR: Record<FeeType, number> = {
  '通常': 1,
  'キャンセル50%': 0.5,
  'キャンセル100%': 1, // 全額請求
};

// 基本料金プラン（旧料金）
export const OLD_FEE_PLANS = {
  '犬の基本プラン': 4200,
  '犬の世話プラン': 3600,
  '犬の散歩プラン': 3200,
  '猫の基本プラン': 3600,
  '小動物の基本プラン': 3600,
  '15分延長': 600,
};

// 基本料金プラン（新料金 - 2025年7月〜）
export const NEW_FEE_PLANS = {
  '犬の基本プラン': 5400,
  '犬の世話プラン': 4600,
  '犬の散歩プラン': 4100,
  '猫の基本プラン': 4600,
  '小動物の基本プラン': 4600,
  '15分延長': 600,
};

// カウンセリング料金（旧料金）
export const OLD_COUNSELING_FEES = {
  'セワクル': {
    '無料': 1100,
    '有料': 2200,
  },
  '東急': {
    '無料': 1100,
    '有料': 2200,
  }
} as const;

// カウンセリング料金（新料金 - 2025年7月〜）
export const NEW_COUNSELING_FEES = {
  'セワクル': {
    '無料': 1380,
    '有料': 2480,
  },
  '東急': {
    '無料': 1600,
    '有料': 2700,
  }
} as const;

// 後方互換性のため残す
export const FREE_COUNSELING_FEE = 1100; // 無料カウンセリングの場合
export const PAID_COUNSELING_FEE = 2200; // 有料カウンセリングの場合
export const COUNSELING_FEE = 1000; // 後方互換性のため残す
export const COUNSELING_TRANSPORTATION_FEE = 455; // カウンセリング交通費

// 出張費（旧料金）
export const OLD_SEWAKURU_TRANSPORTATION_FEE = 600; // セワクル出張費（旧料金）
export const OLD_TOKYU_TRANSPORTATION_FEE = 600; // 東急出張費（旧料金）

// 出張費（新料金 - 2025年7月〜）
export const NEW_SEWAKURU_TRANSPORTATION_FEE = 880; // セワクル出張費（新料金）
export const NEW_TOKYU_TRANSPORTATION_FEE = 1100; // 東急出張費（新料金）

// 後方互換性のために残す
export const SEWAKURU_TRANSPORTATION_FEE = OLD_SEWAKURU_TRANSPORTATION_FEE;
export const TOKYU_TRANSPORTATION_FEE = OLD_TOKYU_TRANSPORTATION_FEE;

// 多頭料金（1頭あたり）
export const OLD_ADDITIONAL_PET_FEE = 800;
export const NEW_ADDITIONAL_PET_FEE = 800;

// 15分延長料金
export const EXTENSION_FEE = 600;

// 鍵の受取・返却料金
export const OLD_KEY_HANDLING_FEE = 1000;
export const NEW_KEY_HANDLING_FEE = 1000;


/**
 * 割増率を計算する
 * @param surcharges 適用される割増の配列
 * @param alliance アライアンス（東急またはセワクル）
 * @returns 割増率（例: 1.2, 1.44）
 */
export function calculateSurchargeRate(surcharges: string[], alliance: '東急' | 'セワクル' = 'セワクル'): number {
  let totalRate = 1;
  
  for (const surcharge of surcharges) {
    if (surcharge === '時間外') {
      totalRate *= (1 + SURCHARGE_RATE);
    } else if (surcharge === 'ハイシーズン' || surcharge === 'ミドルシーズン' || surcharge === 'トップシーズン') {
      const seasonRate = SEASON_SURCHARGE_RATES[alliance][surcharge as keyof typeof SEASON_SURCHARGE_RATES[typeof alliance]];
      totalRate *= (1 + seasonRate);
    }
  }
  
  return totalRate;
}

/**
 * 消費税を計算する（端数切り捨て）
 * @param amount 税抜金額
 * @returns 消費税額
 */
export function calculateTax(amount: number): number {
  return Math.floor(amount * TAX_RATE);
}

/**
 * キャンセル係数を適用した金額を計算する
 * @param amount 元の金額
 * @param feeType 料金タイプ
 * @returns キャンセル係数適用後の金額
 */
export function applyCancel(amount: number, feeType: FeeType): number {
  return Math.floor(amount * CANCEL_FACTOR[feeType]);
}

/**
 * 数値を通貨形式にフォーマットする
 * @param amount 金額
 * @returns フォーマットされた金額（例: ¥1,234）
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    currencyDisplay: 'symbol',
  }).format(amount);
}