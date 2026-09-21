import type { ExternalToast } from "sonner";

/**
 * Lazy toasts. `sonner` is 68 KB of source that only matters after a form is
 * submitted, so it is loaded on first use rather than shipped in the main
 * bundle. The Toaster component in App.tsx loads the same chunk.
 */
const load = () => import("sonner").then((m) => m.toast);

export const toast = {
  success: (message: string, data?: ExternalToast) => { load().then((t) => t.success(message, data)); },
  error: (message: string, data?: ExternalToast) => { load().then((t) => t.error(message, data)); },
  message: (message: string, data?: ExternalToast) => { load().then((t) => t.message(message, data)); },
};
