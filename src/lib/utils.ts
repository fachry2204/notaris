import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Standardizes phone numbers to the 628... format for WhatsApp compatibility.
 * Removes leading '0' or '+62' and ensures the result starts with '628'.
 */
export function formatWhatsApp(phone: string | null | undefined): string {
  if (!phone) return "";
  
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, "");
  
  // If starts with 08, replace 0 with 62
  if (cleaned.startsWith("08")) {
    cleaned = "62" + cleaned.substring(1);
  } else if (cleaned.startsWith("8")) {
    // If starts with 8, add 62
    cleaned = "62" + cleaned;
  } else if (cleaned.startsWith("6208")) {
    // Fix common mistake 6208...
    cleaned = "628" + cleaned.substring(4);
  }
  
  return cleaned;
}
