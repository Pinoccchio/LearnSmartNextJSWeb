import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | number): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  })
}

export function formatNumber(number: number): string {
  return new Intl.NumberFormat("en-US").format(number)
}

export function truncate(str: string, length: number): string {
  return str.length > length ? str.slice(0, length) + "..." : str
}