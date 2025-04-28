'use client';

import { useRef } from 'react';
import { Accordion } from '@/components/ui/Accordion';
import { useFormStore } from '@/store/useFormStore';
import { formatCurrency } from '@/utils/feeCalculator';
import dayjs from 'dayjs';
import html2canvas from 'html2canvas';

export function ResultSection() {
  const resultRef = useRef<HTMLDivElement>(null);
  
  const {
    customerName,
    sitterName,
    sittingDateTime,
    alliance,
    plans,
    multiPet,
    extension,
    keyHandling,
    taxableOptions,
    transportationFee,
    nonTaxableOptions,
    calculationResult,
  } = useFormStore();

  // 日付フォーマット
  const formattedDate = dayjs(sittingDateTime).format('YYYY/MM/DD HH:mm');

  // アライアンスに応じたカラークラスを設定
  const colorClasses = alliance === 'セワクル' 
    ? { primary: 'bg-sewakuru-primary', light: 'bg-sewakuru-light', text: 'text-sewakuru-primary' }
    : { primary: 'bg-tokyu-primary', light: 'bg-tokyu-light', text: 'text-tokyu-primary' };

  // 結果をテキストとしてコピーする関数
  const copyResultAsText = () => {
    if (!calculationResult) return;

    const resultText = `
実施日: ${formattedDate}
お客様名: ${customerName} 様
シッター名: ${sitterName}
──────── 合計 ${formatCurrency(calculationResult.grandTotal)} ──────────

■課税明細
${plans.map(plan => `  ${plan.name} × ${plan.count}回  ${formatCurrency(plan.unitPrice * plan.count)} (税抜)`).join('\n')}
${multiPet.additionalPets > 0 ? `  多頭オプション(${multiPet.additionalPets}頭)  ${formatCurrency(multiPet.additionalPets * 1000)} (税抜)\n` : ''}
${extension.count > 0 ? `  15分延長 × ${extension.count}回  ${formatCurrency(extension.count * 600)} (税抜)\n` : ''}
${keyHandling.count > 0 ? `  鍵の受取・返却 × ${keyHandling.count}回  ${formatCurrency(keyHandling.count * 1000)} (税抜)\n` : ''}
${taxableOptions.map(option => `  ${option.name} × ${option.count}回  ${formatCurrency(option.unitPrice * option.count)} (税抜)`).join('\n')}
  小計(税抜)  ${formatCurrency(calculationResult.subtotalTaxExcluded)}
  消費税     ${formatCurrency(calculationResult.tax)}
  小計(税込)  ${formatCurrency(calculationResult.subtotalTaxIncluded)}

■非課税明細
${transportationFee.count > 0 ? `  出張費 × ${transportationFee.count}回  ${formatCurrency(transportationFee.count * 546)}\n` : ''}
${nonTaxableOptions.map(option => `  ${option.name} × ${option.count}回  ${formatCurrency(option.unitPrice * option.count)}`).join('\n')}
  非課税合計  ${formatCurrency(calculationResult.nonTaxableTotal)}
`.trim();

    navigator.clipboard.writeText(resultText)
      .then(() => {
        alert('結果をクリップボードにコピーしました');
      })
      .catch(err => {
        console.error('コピーに失敗しました:', err);
        alert('コピーに失敗しました');
      });
  };

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
      link.download = `見積_${customerName}_${dayjs().format('YYYYMMDD_HHmmss')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }).catch(err => {
      console.error('画像の生成に失敗しました:', err);
      alert('画像の生成に失敗しました');
    });
  };

  return (
    <Accordion title="計算結果" defaultOpen={!!calculationResult}>
      {calculationResult ? (
        <div className="space-y-4">
          {/* 結果表示エリア */}
          <div 
            ref={resultRef} 
            className="p-4 border rounded-md bg-white max-w-md mx-auto"
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

            {/* 課税明細 */}
            <div className="p-3 border-b">
              <h3 className={`font-bold ${colorClasses.text} mb-2`}>■課税明細</h3>
              <div className="space-y-1 pl-2">
                {/* プラン */}
                {plans.map((plan) => (
                  <div key={plan.id} className="flex justify-between text-sm">
                    <span>{plan.name} × {plan.count}回</span>
                    <span>{formatCurrency(plan.unitPrice * plan.count)} (税抜)</span>
                  </div>
                ))}

                {/* 多頭オプション */}
                {multiPet.additionalPets > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>多頭オプション({multiPet.additionalPets}頭)</span>
                    <span>{formatCurrency(multiPet.additionalPets * 1000)} (税抜)</span>
                  </div>
                )}

                {/* 15分延長 */}
                {extension.count > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>15分延長 × {extension.count}回</span>
                    <span>{formatCurrency(extension.count * 600)} (税抜)</span>
                  </div>
                )}

                {/* 鍵の受取・返却 */}
                {keyHandling.count > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>鍵の受取・返却 × {keyHandling.count}回</span>
                    <span>{formatCurrency(keyHandling.count * 1000)} (税抜)</span>
                  </div>
                )}

                {/* その他課税オプション */}
                {taxableOptions.map((option) => (
                  <div key={option.id} className="flex justify-between text-sm">
                    <span>{option.name} × {option.count}回</span>
                    <span>{formatCurrency(option.unitPrice * option.count)} (税抜)</span>
                  </div>
                ))}

                {/* 小計（税抜） */}
                <div className="flex justify-between font-medium pt-1 border-t">
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

            {/* 非課税明細 */}
            <div className="p-3">
              <h3 className={`font-bold ${colorClasses.text} mb-2`}>■非課税明細</h3>
              <div className="space-y-1 pl-2">
                {/* 出張費 */}
                {transportationFee.count > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>出張費 × {transportationFee.count}回</span>
                    <span>{formatCurrency(transportationFee.count * 546)}</span>
                  </div>
                )}

                {/* その他非課税オプション */}
                {nonTaxableOptions.map((option) => (
                  <div key={option.id} className="flex justify-between text-sm">
                    <span>{option.name} × {option.count}回</span>
                    <span>{formatCurrency(option.unitPrice * option.count)}</span>
                  </div>
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
          </div>

          {/* アクションボタン */}
          <div className="flex space-x-2">
            <button
              type="button"
              className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={copyResultAsText}
            >
              テキストとしてコピー
            </button>
            <button
              type="button"
              className="flex-1 py-2 px-4 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              onClick={saveResultAsImage}
            >
              画像として保存
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          計算ボタンを押すと、ここに結果が表示されます。
        </div>
      )}
    </Accordion>
  );
}