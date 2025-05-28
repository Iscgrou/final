import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Persian number formatter
export function formatPersianNumber(num: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num.toString().replace(/\d/g, (digit) => persianDigits[parseInt(digit)]);
}

// Format currency for Persian display
export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '۰';
  
  return new Intl.NumberFormat('fa-IR').format(num);
}

// Convert Persian/Arabic digits to English
export function normalizeDigits(str: string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  
  let result = str;
  
  for (let i = 0; i < 10; i++) {
    const regex1 = new RegExp(persianDigits[i], 'g');
    const regex2 = new RegExp(arabicDigits[i], 'g');
    result = result.replace(regex1, i.toString()).replace(regex2, i.toString());
  }
  
  return result;
}

// Format Persian date
export function formatPersianDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const persianMonths = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ];
  
  // Simple Gregorian to Persian conversion approximation
  // In a real app, use a proper Persian calendar library
  const year = d.getFullYear();
  const month = d.getMonth();
  const day = d.getDate();
  
  const persianYear = year - 621;
  const persianMonth = persianMonths[month % 12];
  
  return `${formatPersianNumber(day)} ${persianMonth} ${formatPersianNumber(persianYear)}`;
}

// Get Persian time
export function formatPersianTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  
  return formatPersianNumber(`${hours}:${minutes}`);
}

// Generate invoice number
export function generateInvoiceNumber(repId: number, month: string): string {
  const timestamp = Date.now().toString().slice(-6);
  return `INV-${repId}-${month.replace('/', '')}-${timestamp}`;
}

// Calculate percentage change
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

// Validate Iranian phone number
export function validateIranianPhone(phone: string): boolean {
  const normalized = normalizeDigits(phone);
  const iranianPhoneRegex = /^(\+98|0)?9\d{9}$/;
  return iranianPhoneRegex.test(normalized);
}

// Validate Telegram username
export function validateTelegramUsername(username: string): boolean {
  const telegramUsernameRegex = /^@?[a-zA-Z0-9_]{5,32}$/;
  return telegramUsernameRegex.test(username);
}

// Create Telegram link
export function createTelegramLink(username: string): string {
  const cleanUsername = username.replace('@', '');
  return `https://t.me/${cleanUsername}`;
}

// File size formatter
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '۰ بایت';
  
  const k = 1024;
  const sizes = ['بایت', 'کیلوبایت', 'مگابایت', 'گیگابایت'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  const size = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
  return `${formatPersianNumber(size)} ${sizes[i]}`;
}

// Debounce function
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Sleep utility
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
