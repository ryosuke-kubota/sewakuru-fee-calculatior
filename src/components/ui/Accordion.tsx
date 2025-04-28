'use client';

import { useState, ReactNode } from 'react';
import clsx from 'clsx';

interface AccordionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function Accordion({ title, children, defaultOpen = false, className = '' }: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={clsx('border rounded-md mb-4', className)}>
      <button
        type="button"
        className={clsx(
          'w-full px-4 py-3 text-left font-medium flex justify-between items-center',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
          isOpen ? 'border-b' : ''
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{title}</span>
        <svg
          className={clsx(
            'w-5 h-5 transition-transform duration-200',
            isOpen ? 'transform rotate-180' : ''
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      <div
        className={clsx(
          'transition-all duration-200 overflow-hidden',
          isOpen ? 'opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}