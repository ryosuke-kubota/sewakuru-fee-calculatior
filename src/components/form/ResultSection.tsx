'use client';

import { useRef, useState, useEffect } from 'react';
import { useFormStore } from '@/store/useFormStore';
import { formatCurrency, FREE_COUNSELING_FEE, PAID_COUNSELING_FEE } from '@/utils/feeCalculator';
import dayjs from 'dayjs';
import html2canvas from 'html2canvas';

export function ResultSection() {
  const resultRef = useRef<HTMLDivElement>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  
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
  } = useFormStore();

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
  const saveResultAsImage = () => {
    if (!resultRef.current || !calculationResult) return;

    const resultElement = resultRef.current;

    // html2canvasを使用してHTML要素を画像に変換
    html2canvas(resultElement, {
      backgroundColor: '#ffffff',
      scale: 2, // 高解像度のために2倍のスケールで描画
      useCORS: true, // クロスオリジンの画像を許可
      logging: false, // デバッグログを無効化
    }).then(canvas => {
      // 画像をダウンロード
      const link = document.createElement('a');
      link.download = `シッティング明細_${customerName}_${dayjs().format('YYYYMMDD_HHmmss')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }).catch(err => {
      console.error('画像の生成に失敗しました:', err);
      alert('画像の生成に失敗しました');
    });
  };

  // 結果を画像として生成する関数
  const generateResultImage = () => {
    if (!resultRef.current || !calculationResult) return;

    const resultElement = resultRef.current;

    // html2canvasを使用してHTML要素を画像に変換
    html2canvas(resultElement, {
      backgroundColor: '#ffffff',
      scale: 2, // 高解像度のために2倍のスケールで描画
      useCORS: true, // クロスオリジンの画像を許可
      logging: false, // デバッグログを無効化
    }).then(canvas => {
      // 画像のURLを状態に保存
      setResultImage(canvas.toDataURL('image/png'));
    }).catch(err => {
      console.error('画像の生成に失敗しました:', err);
      setResultImage(null);
    });
  };

  // 計算結果が更新されたときに画像を生成
  useEffect(() => {
    if (calculationResult) {
      // 少し遅延させて、DOMが完全に描画された後に実行
      const timer = setTimeout(() => {
        generateResultImage();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setResultImage(null);
    }
  }, [calculationResult, customerName, sitterName, sittingDateTime, feeType, feeSelection, alliance, counseling, plans, multiPet, keyHandling, taxableOptions, nonTaxableOptions]);

  return (
    <>
      {calculationResult ? (
        <div className="space-y-4">
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
                  <div className='text-xs border rounded-full px-4'><div className='text-xs h-7'>{feeType}</div></div>
                  <div className='text-xs border rounded-full px-4'><div className='text-xs h-7'>{feeSelection}</div></div>
                  <div className='text-xs border rounded-full px-4'><div className='text-xs h-7'>{alliance}</div></div>
                </div>
              </div>

              {/* カウンセリング */}
              <div className="p-3 border-b">
                <h3 className={`font-bold ${colorClasses.text} mb-2`}>■カウンセリング</h3>
                <div className="space-y-1 pl-2">
                  {/* カウンセリング料金 */}
                  <div className="flex justify-between text-sm">
                    <span>{counseling}カウンセリング × 1回</span>
                    <span>{formatCurrency(counseling === '無料' ? FREE_COUNSELING_FEE : PAID_COUNSELING_FEE)}</span>
                  </div>
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
                      <span>{formatCurrency(plan.unitPrice * plan.count)}</span>
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
                    <span>消費税</span>
                    <span>{formatCurrency(calculationResult.tax)}</span>
                  </div>

                  {/* 小計（税込） */}
                  <div className="flex justify-between font-medium">
                    <span>小計(税込)</span>
                    <span>{formatCurrency(calculationResult.subtotalTaxIncluded)}</span>
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

                  {/* 非課税合計 */}
                  {calculationResult.nonTaxableTotal > 0 && (
                    <div className="flex justify-between font-medium pt-1 border-t">
                      <span>非課税合計</span>
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

          {/* 生成された画像の表示 */}
          {resultImage && (
            <div className="mt-4 border rounded-md overflow-hidden">
              <div className='bg-gray-100 py-2'>
                <h3 className="text-center font-bold bg-gray-100">明細画像</h3>
                <p className='text-xs text-center'>画像長押しで保存できます</p>
              </div>
              <div className="p-2 flex justify-center">
                <img
                  src={resultImage}
                  alt="シッティング明細"
                  className="max-w-full"
                  style={{ maxHeight: '500px' }}
                />
              </div>
            </div>
          )}

          {/* アクションボタン */}
          <div className="flex space-x-2">
            <button
              type="button"
              className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={saveResultAsImage}
            >
              画像として保存
            </button>
            <button
              type="button"
              className="flex-1 py-2 px-4 bg-purple-500 text-white rounded-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              onClick={generateResultImage}
            >
              画像を再生成
            </button>
            <a
              href={`/receipt?data=${encodeURIComponent(JSON.stringify({
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
                calculationResult
              }))}`}
              target="_blank"
              className="flex-1 py-2 px-4 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-center"
            >
              別ページで表示
            </a>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          計算ボタンを押すと、ここに結果が表示されます。
        </div>
      )}
    </>
  );
}