import { Language, Translations } from './types';
import { frTranslations } from './translations-fr';
import { enTranslations } from './translations-en';

export const translations: Record<Language, Translations> = {
  fr: frTranslations,
  en: enTranslations,
};

export * from './types';