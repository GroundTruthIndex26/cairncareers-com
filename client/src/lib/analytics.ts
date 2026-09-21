import { analytics } from "@heycatch/sdk";

/**
 * Key events for the HeyCatch funnel.
 *
 * Autocapture already records pageviews, but the funnel steps are defined on
 * named events, so a visitor who reached /roadmap or the careers sample page
 * counted as nobody. Each step is one call here, with the event names the
 * funnel steps are configured on.
 *
 * Skipped when navigator.webdriver is set: the build prerenders every route
 * in a headless browser, and without the guard every deploy would add one
 * fake visitor to each step.
 */
export const KEY_EVENTS = {
  previewedCareers: "previewed_careers",
  viewedRoadmap: "viewed_roadmap",
} as const;

export function trackKeyEvent(event: (typeof KEY_EVENTS)[keyof typeof KEY_EVENTS], properties?: Record<string, string | number | boolean | null>) {
  try {
    if (typeof navigator !== "undefined" && navigator.webdriver) return;
    analytics.trackEvent(event, { path: window.location.pathname, ...properties });
  } catch {
    // Analytics must never break the page.
  }
}
