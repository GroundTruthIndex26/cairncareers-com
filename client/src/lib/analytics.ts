/**
 * HeyCatch analytics, loaded after the page is idle.
 *
 * The SDK is 240 KB of source. Initialising it in the entry file put all of
 * it in the bundle every visitor parses before the page is interactive, on a
 * site where the visitor's first job is to read a headline. It now loads in
 * its own chunk once the page has painted and the main thread is quiet, and
 * every key event waits for that same load, so init always runs first.
 *
 * Trade-off: a visitor who leaves within the first couple of seconds is not
 * counted. That is the same visitor the funnel could never act on.
 */
import type { analytics as Analytics } from "@heycatch/sdk";

const PROJECT_KEY = "hck_pk_UsKbBSEW_ueO-fGreK3McdcUpnajFEsQ";

let loading: Promise<typeof Analytics> | null = null;

export function loadAnalytics() {
  if (!loading) {
    loading = import("@heycatch/sdk").then(({ analytics }) => {
      // TODO: add `requestBatching: false` once a stable @heycatch/sdk accepts
      // it (0.7.0 does not). Every internal link is a plain <a href>, so each
      // navigation is a full page load and a held batch can leave with it.
      analytics.init({ projectKey: PROJECT_KEY, install: { framework: "vite-react", agent: "claude-code" } });
      return analytics;
    });
  }
  return loading;
}

/** Schedules loadAnalytics for the first idle moment after the page has loaded. */
export function scheduleAnalytics() {
  if (typeof window === "undefined") return;
  const start = () => {
    if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(() => { loadAnalytics(); }, { timeout: 2500 });
    else window.setTimeout(() => { loadAnalytics(); }, 1200);
  };
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start, { once: true });
}

/**
 * Key events for the HeyCatch funnel. The funnel steps are defined on these
 * names; autocaptured pageviews alone left both steps at zero.
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
    const path = window.location.pathname;
    loadAnalytics().then((a) => a.trackEvent(event, { path, ...properties })).catch(() => {});
  } catch {
    // Analytics must never break the page.
  }
}

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string> }) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Conversions sent to Plausible and GA4, which attribute each one to the
 * visit's utm_source and referrer. That is how a signup from an Instagram or
 * Reddit post is counted: tag the post's link with UTMs (see
 * docs/social-utm-links.md) and read the goal broken down by source.
 *
 * Plausible needs a custom-event goal named "Signup" and one named
 * "Contact", plus the "list" custom property, before these show up there.
 * GA4 receives the recommended generate_lead event for signups.
 */
export type Conversion = { name: "Signup"; list: "launch" | "beta" } | { name: "Contact" };

export function trackConversion(conversion: Conversion) {
  try {
    if (typeof navigator !== "undefined" && navigator.webdriver) return;
    const props: Record<string, string> = conversion.name === "Signup" ? { list: conversion.list } : {};
    window.plausible?.(conversion.name, { props });
    window.gtag?.("event", conversion.name === "Signup" ? "generate_lead" : "contact_submit", props);
  } catch {
    // Analytics must never break the page.
  }
}
