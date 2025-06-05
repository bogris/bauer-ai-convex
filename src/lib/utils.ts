import { twMerge } from "tailwind-merge";
import clsx from "clsx";

// Utility to concatenate class names, skipping falsy values
export function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(...inputs));
}
