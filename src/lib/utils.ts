import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function randomChoice<T>(arr: ArrayLike<T>) {
  return arr[Math.floor(Math.random() * arr.length)]
}
