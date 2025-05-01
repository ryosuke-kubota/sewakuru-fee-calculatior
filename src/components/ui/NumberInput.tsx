'use client';

import React, { useState, useEffect, useRef } from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';

interface NumberInputProps {
  id: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  required?: boolean;
  error?: string;
  onChange: (value: number) => void;
  register?: UseFormRegisterReturn;
  className?: string;
}

export function NumberInput({
  id,
  value,
  min = 0,
  max,
  step = 1,
  label,
  required = false,
  error,
  onChange,
  register,
  className = '',
}: NumberInputProps) {
  // 内部状態
  const [displayValue, setDisplayValue] = useState<string>(value.toString());
  const [internalValue, setInternalValue] = useState<number>(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // 外部からの値の変更を検知して内部状態を更新
  useEffect(() => {
    setInternalValue(value);
    setDisplayValue(value.toString());
  }, [value]);

  // プラスボタン処理
  const increment = () => {
    const newValue = max !== undefined ? Math.min(internalValue + step, max) : internalValue + step;
    setInternalValue(newValue);
    setDisplayValue(newValue.toString());
    onChange(newValue);
  };

  // マイナスボタン処理
  const decrement = () => {
    const newValue = Math.max(internalValue - step, min);
    setInternalValue(newValue);
    setDisplayValue(newValue.toString());
    onChange(newValue);
  };

  // 入力値変更処理
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    
    // 空または数字のみを許可
    if (text === '' || /^[0-9]*$/.test(text)) {
      setDisplayValue(text);
      
      // 数値として有効な場合は内部値も更新（React Hook Formの valueAsNumber との互換性のため）
      if (text !== '' && !isNaN(Number(text))) {
        const numValue = Number(text);
        setInternalValue(numValue);
        onChange(numValue);
      }
    }
  };

  // フォーカスが外れたときの処理
  const handleBlur = () => {
    try {
      // 空の場合は最小値を設定
      if (displayValue === '' || isNaN(Number(displayValue))) {
        setDisplayValue(min.toString());
        setInternalValue(min);
        onChange(min);
        return;
      }
      
      // 数値に変換
      let numValue = Number(displayValue);
      
      // 最小値・最大値の範囲内に制限
      numValue = Math.max(numValue, min);
      if (max !== undefined) {
        numValue = Math.min(numValue, max);
      }
      
      // 状態を更新
      setInternalValue(numValue);
      setDisplayValue(numValue.toString());
      onChange(numValue);
    } catch (error) {
      // エラーが発生した場合は現在の値に戻す
      setDisplayValue(internalValue.toString());
      console.error('入力値の処理中にエラーが発生しました:', error);
    }
  };

  // Enterキー処理
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBlur();
      inputRef.current?.blur();
    }
  };

  // React Hook Form用のprops
  const registerProps = register ? {
    name: register.name,
    ref: (el: HTMLInputElement | null) => {
      inputRef.current = el;
      if (register.ref && el) {
        register.ref(el);
      }
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
      handleBlur();
      if (register.onBlur) {
        // 数値が正しく設定されていることを確認してからonBlurを呼び出す
        const numValue = isNaN(Number(displayValue)) ? min : Number(displayValue);
        const newEvent = {
          ...e,
          target: {
            ...e.target,
            value: numValue.toString()
          }
        };
        register.onBlur(newEvent as React.FocusEvent<HTMLInputElement>);
      }
    },
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      handleChange(e);
      if (register.onChange) {
        // 数値が正しく設定されていることを確認してからonChangeを呼び出す
        if (e.target.value !== '' && !isNaN(Number(e.target.value))) {
          const numValue = Number(e.target.value);
          const newEvent = {
            ...e,
            target: {
              ...e.target,
              value: numValue.toString()
            }
          };
          register.onChange(newEvent as React.ChangeEvent<HTMLInputElement>);
        } else {
          register.onChange(e);
        }
      }
    }
  } : {};

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="flex items-center">
        <button
          type="button"
          className="flex-none w-10 h-10 flex items-center justify-center bg-gray-200 rounded-l-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={decrement}
          disabled={internalValue <= min}
        >
          <span className="text-xl">−</span>
        </button>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          min={min}
          max={max}
          value={displayValue}
          onKeyDown={handleKeyDown}
          className={`flex-1 h-10 w-full px-3 py-2 text-center border-y focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
          {...registerProps}
        />
        <button
          type="button"
          className="flex-none w-10 h-10 flex items-center justify-center bg-gray-200 rounded-r-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={increment}
          disabled={max !== undefined && internalValue >= max}
        >
          <span className="text-xl">+</span>
        </button>
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}