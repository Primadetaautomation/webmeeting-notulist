import React from 'react';
import { useTranslation } from 'react-i18next';

const GlobeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
  </svg>
);

interface LanguageSelectorProps {
  variant?: 'dropdown' | 'buttons';
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'dropdown',
  className = ''
}) => {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  if (variant === 'buttons') {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <button
          onClick={() => changeLanguage('en')}
          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
            i18n.language === 'en'
              ? 'bg-primary-500 text-white'
              : 'bg-surface-700 text-surface-400 hover:text-white'
          }`}
        >
          EN
        </button>
        <button
          onClick={() => changeLanguage('nl')}
          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
            i18n.language === 'nl'
              ? 'bg-primary-500 text-white'
              : 'bg-surface-700 text-surface-400 hover:text-white'
          }`}
        >
          NL
        </button>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <select
        value={i18n.language}
        onChange={(e) => changeLanguage(e.target.value)}
        className="appearance-none bg-surface-800 border border-surface-700 rounded-lg pl-8 pr-8 py-1.5 text-sm text-surface-300 cursor-pointer hover:border-surface-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
      >
        <option value="en">{t('languages.en')}</option>
        <option value="nl">{t('languages.nl')}</option>
      </select>
      <GlobeIcon />
      <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-surface-400">
        <GlobeIcon />
      </div>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-surface-400">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </div>
    </div>
  );
};

export default LanguageSelector;
