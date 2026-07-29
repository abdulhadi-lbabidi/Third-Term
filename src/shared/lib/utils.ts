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
export function formatArabicDate(date: Date | string, padDay = true, includeYear = true) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const levantMonths = ['كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران', 'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول'];

  let day = dateObj.getDate().toString();
  if (padDay) {
    day = day.padStart(2, '0');
  }

  const month = levantMonths[dateObj.getMonth()];
  
  let result = `${day} ${month}`;
  if (includeYear) {
    result += ` ${dateObj.getFullYear()}`;
  }

  return result;
}