/** @type {import('tailwindcss').Config} */
import forms from '@tailwindcss/forms';

export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // セワクルカラー
        sewakuru: {
          primary: '#5d9c4b',
          light: '#d9ead3',
        },
        // 東急カラー
        tokyu: {
          primary: '#AA7715',
          light: '#fbe8c4',
        },
      },
    },
  },
  plugins: [
    forms,
  ],
}