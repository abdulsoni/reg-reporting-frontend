const RAW_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false";

export const API_BASE_URL = RAW_BASE_URL.replace(/\/$/, "");

export const IS_MOCK = USE_MOCK;

/**
 * Build an API URL. Without a base URL this would resolve against the Next.js
 * origin, so an unset value fails loudly rather than issuing a request the app
 * server will answer with a 404.
 */
export function apiUrl(path: string): string {
  if (!API_BASE_URL && !IS_MOCK) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL is not set, so API calls cannot be made."
    );
  }

  return `${API_BASE_URL}${path}`;
}