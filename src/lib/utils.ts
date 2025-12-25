import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Объединяет классы Tailwind CSS с поддержкой условных классов
 * @param inputs - Массив классов или объектов с условиями
 * @returns Объединенная строка классов
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}