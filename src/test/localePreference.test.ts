import { describe, it, expect } from 'vitest';
import { resolveLocalePreference } from '@/i18n/localePreference';
describe('shared language preference', () => {
  it('keeps explicit English across French browser pages', () => expect(resolveLocalePreference('en', 'fr', 'fr-FR')).toBe('en'));
  it('migrates the old English landing choice', () => expect(resolveLocalePreference(null, 'en', 'fr-FR')).toBe('en'));
  it('starts English browsers in English', () => expect(resolveLocalePreference(null, null, 'en-US')).toBe('en'));
});