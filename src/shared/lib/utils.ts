import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
/**
 * تنسيق التاريخ باللغة العربية مع أرقام غربية (0-9)
 * @param {Date|string} date - التاريخ
 * @param {string} locale - 'ar-SA' (يوليو) أو 'ar-SY' (تموز)
 * @param {boolean} padDay - هل نضيف صفراً أمام اليوم (true => 09, false => 9)
 * @param {boolean} includeYear - هل نعرض السنة
 * @returns {string}
 */
export function formatArabicDate(date: Date | string, locale = 'ar-SY', padDay = true, includeYear = true) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  // 1. استخدام formatToParts للحصول على الأجزاء بدقة
  const formatter = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: includeYear ? 'numeric' : undefined,
    numberingSystem: 'latn', // أرقام غربية
  });

  const parts = formatter.formatToParts(dateObj);

  // 2. استخراج القيم
  const dayPart = parts.find(p => p.type === 'day');
  const monthPart = parts.find(p => p.type === 'month');
  const yearPart = parts.find(p => p.type === 'year');

  // 3. معالجة اليوم (إضافة صفر إذا لزم الأمر)
  let day = dayPart ? dayPart.value : '';
  if (padDay) {
    day = day.padStart(2, '0');
  }

  // 4. إعادة التجميع
  let result = `${day} ${monthPart ? monthPart.value : ''}`;
  if (includeYear && yearPart) {
    result += ` ${yearPart.value}`;
  }

  return result;
}