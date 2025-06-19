'use client';

import { calculateSurchargeRate, formatCurrency } from '@/utils/feeCalculator';
import dayjs from 'dayjs';
import { useRef, useState, useEffect, Suspense } from 'react';
// import html2canvas from 'html2canvas';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FormState } from '@/store/useFormStore';

function ReceiptContent() {
  const resultRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const [receiptData, setReceiptData] = useState<FormState | null>(null);
  
  useEffect(() => {
    // まずlocalStorageからデータを取得を試行
    try {
      const storedData = localStorage.getItem('receiptData');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setReceiptData(parsedData);
        // データを使用後にクリーンアップ
        localStorage.removeItem('receiptData');
        return;
      }
    } catch (error) {
      console.error('localStorageからのデータ取得に失敗:', error);
    }

    // フォールバック: URLパラメータからデータを取得
    const dataParam = searchParams.get('data');
    if (dataParam) {
      try {
        // まずURLパラメータをデコードを試行
        let decodedData;
        try {
          decodedData = decodeURIComponent(dataParam);
        } catch (decodeError) {
          console.error('URLデコードエラー:', decodeError);
          console.error('問題のあるパラメータ:', dataParam);
          setReceiptData(null);
          return;
        }
        
        // JSONパースを試行
        try {
          const parsedData = JSON.parse(decodedData);
          setReceiptData(parsedData);
        } catch (parseError) {
          console.error('JSONパースエラー:', parseError);
          console.error('問題のあるデータ:', decodedData);
          setReceiptData(null);
        }
      } catch (error) {
        console.error('予期しないエラー:', error);
        setReceiptData(null);
      }
    }
  }, [searchParams]);
  
  // データがない場合は早期リターン
  if (!receiptData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 flex flex-col items-center justify-center">
        <div className="text-center py-8 text-gray-500">
          計算結果がありません。先にメインページで計算を行ってください。
        </div>
        <Link href="/" className="mt-4 py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600">
          メインページに戻る
        </Link>
      </div>
    );
  }
  
  const {
    customerName,
    sitterName,
    sittingDateTime,
    feeType,
    feeSelection,
    alliance,
    counseling,
    plans,
    multiPet,
    keyHandling,
    taxableOptions,
    nonTaxableOptions,
    calculationResult,
  } = receiptData;

  // 日付フォーマット
  const formattedDate = dayjs(sittingDateTime).format('YYYY/MM/DD HH:mm');

  // トータルプラン数
  const totalPlanCount = plans.reduce((sum, plan) => {
    // 15分延長プランは除外
    if (plan.name === '15分延長') return sum;
    return sum + plan.count;
  }, 0)

  // アライアンスに応じたカラークラスを設定
  const colorClasses = alliance === 'セワクル' 
    ? { primary: 'bg-sewakuru-primary', light: 'bg-sewakuru-light', text: 'text-sewakuru-primary' }
    : { primary: 'bg-tokyu-primary', light: 'bg-tokyu-light', text: 'text-tokyu-primary' };

  // 結果をスクリーンショットとして保存する関数
  // const saveResultAsImage = () => {
  //   if (!resultRef.current || !calculationResult) return;

  //   const resultElement = resultRef.current;

  //   // html2canvasを使用してHTML要素を画像に変換
  //   html2canvas(resultElement, {
  //     backgroundColor: '#ffffff',
  //     scale: 2, // 高解像度のために2倍のスケールで描画
  //     useCORS: true, // クロスオリジンの画像を許可
  //     logging: false, // デバッグログを無効化
  //   }).then(canvas => {
  //     // 画像をダウンロード
  //     const link = document.createElement('a');
  //     link.download = `見積_${customerName}_${dayjs().format('YYYYMMDD_HHmmss')}.png`;
  //     link.href = canvas.toDataURL('image/png');
  //     link.click();
  //   }).catch(err => {
  //     console.error('画像の生成に失敗しました:', err);
  //     alert('画像の生成に失敗しました');
  //   });
  // };

  if (!calculationResult) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 flex flex-col items-center justify-center">
        <div className="text-center py-8 text-gray-500">
          計算結果がありません。先にメインページで計算を行ってください。
        </div>
        <Link href="/" className="mt-4 py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600">
          メインページに戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 flex flex-col items-center">
      {/* 結果表示エリア */}
      <div 
        ref={resultRef} 
        className="p-4 bg-white max-w-md mx-auto"
        style={{ maxWidth: '640px', minHeight: '200px' }}
      >
        {/* ヘッダー */}
        <div className={`${colorClasses.primary} text-white p-3 rounded-t-md`}>
          <div>
            <h2 className='font-bold text-xl text-center my-3'>ーシッティング明細ー</h2>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm">実施日</div>
              <div className="font-bold">{formattedDate}</div>
            </div>
            <div className="text-right">
              <div className="text-sm">お客様名</div>
              <div className="font-bold">{customerName} 様</div>
            </div>
          </div>
          <div className="mt-2">
            <div className="text-sm">シッター名</div>
            <div className="font-bold">{sitterName}</div>
          </div>
        </div>

        {/* 合計金額 */}
        <div className={`${colorClasses.light} p-3 font-bold text-right text-lg border-b-2 ${colorClasses.text}`}>
          ご利用金額 {formatCurrency(calculationResult.grandTotal)}
        </div>

        <div className="p-3 border-b">
          <div className='flex gap-1'>
            <div className='text-xs border rounded-full px-4 py-1'>{feeType}</div>
            <div className='text-xs border rounded-full px-4 py-1'>{feeSelection}</div>
            <div className='text-xs border rounded-full px-4 py-1'>{alliance}</div>
          </div>
        </div>

        {/* カウンセリング */}
        <div className="p-3 border-b">
          <h3 className={`font-bold ${colorClasses.text} mb-2`}>■カウンセリング</h3>
          <div className="space-y-1 pl-2">
            {/* カウンセリング料金 */}
            {counseling === 'なし' ? (
              <div className="flex justify-between text-sm">
                <span>なし</span>
                <span>{formatCurrency(0)}</span>
              </div>
            ) : (
              <div className="flex justify-between text-sm">
                <span>{counseling}カウンセリング × 1回</span>
                <span>{formatCurrency(calculationResult.counselingFee)}</span>
              </div>
            )}
          </div>
        </div>

        {/* シッティング */}
        <div className="p-3 border-b">
          <h3 className={`font-bold ${colorClasses.text} mb-2`}>■シッティング</h3>
          <div className="space-y-1 pl-2">
            {/* プラン */}
            {plans.map((plan) => (
              <div key={plan.id} className="flex justify-between items-center text-sm">
                <span>{plan.name} × {plan.count}回 {plan.surcharges.length > 0 && `(${plan.surcharges})`}</span>
                <span>{formatCurrency(plan.unitPrice * plan.count * calculateSurchargeRate(plan.surcharges, alliance))}</span>
              </div>
            ))}

            {multiPet.additionalPets > 0 || keyHandling.count > 0 || taxableOptions.length > 0 ? (
              <div className='border border-dashed my-3'></div>
            ):(<></>)}

            {/* 多頭オプション */}
            {multiPet.additionalPets > 0 && (
              <div className="flex justify-between text-sm">
                <span>多頭料金 × {multiPet.additionalPets}頭 × {totalPlanCount}回</span>
                <span>
                  {formatCurrency(
                    multiPet.additionalPets *
                    // 15分延長以外のプランの合計数を計算
                    totalPlanCount *
                    // 料金選択に基づいて単価を決定（旧料金: 800円、新料金: 800円）
                    (feeSelection === '旧料金' ? 800 : 800)
                  )}
                </span>
              </div>
            )}

            {/* 鍵の受取・返却 */}
            {keyHandling.count > 0 && (
              <div className="flex justify-between text-sm">
                <span>鍵の受取・返却 × {keyHandling.count}回</span>
                <span>{formatCurrency(keyHandling.count * 1000)}</span>
              </div>
            )}

            {/* その他課税オプション */}
            {taxableOptions.map((option) => (
              <div key={option.id} className="flex justify-between text-sm">
                <span>{option.name} × {option.count}回</span>
                <span>{formatCurrency(option.unitPrice * option.count)}</span>
              </div>
            ))}

            {/* 小計（税抜） */}
            <div className="flex justify-between font-medium pt-1 mt-6 border-t">
              <span>小計(税抜)</span>
              <span>{formatCurrency(calculationResult.subtotalTaxExcluded)}</span>
            </div>

            {/* 消費税 */}
            <div className="flex justify-between">
              <span>消費税(10%)</span>
              <span>{formatCurrency(calculationResult.tax)}</span>
            </div>

            {/* 課税項目小計 */}
            <div className="flex justify-between font-medium">
              <span>課税項目小計</span>
              <span>{formatCurrency(calculationResult.subtotalTaxExcluded + calculationResult.tax)}</span>
            </div>
          </div>
        </div>

        {/* 諸経費 */}
        <div className="p-3">
          <h3 className={`font-bold ${colorClasses.text} mb-2`}>■諸経費</h3>
          <div className="space-y-1 pl-2">

            {/* その他非課税オプション */}
            {nonTaxableOptions.map((option) => (
              (option.name && option.count > 0) && (
                <div key={option.id} className="flex justify-between text-sm">
                  <span>{option.name} × {option.count}回</span>
                  <span>{formatCurrency(option.unitPrice * option.count)}</span>
                </div>
              )
            ))}

            {/* 非課税項目小計 */}
            {calculationResult.nonTaxableTotal > 0 && (
              <div className="flex justify-between font-medium pt-1 border-t">
                <span>非課税項目小計</span>
                <span>{formatCurrency(calculationResult.nonTaxableTotal)}</span>
              </div>
            )}
          </div>
        </div>
        {/* メッセージ */}
        <div className='p-3'>
          <p className='text-xs'>ご利用いただきありがとうございます。<br />
          ご不明な点がございましたら、担当のシッターまでお気軽にお問い合わせください。</p>
        </div>
      </div>
    </div>
  );
}

export default function ReceiptPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 py-8 px-4 flex flex-col items-center justify-center">
        <div className="text-center py-8 text-gray-500">
          読み込み中...
        </div>
      </div>
    }>
      <ReceiptContent />
    </Suspense>
  );
}