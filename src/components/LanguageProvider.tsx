import React from 'react';

// LanguageProvider has been removed as the application is now English-only
// This is a placeholder to avoid import errors

export const useLanguage = () => {
  throw new Error('Language system has been removed - application is now English-only');
};

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export const useTranslation = () => {
  throw new Error('Translation system has been removed - application is now English-only');
};