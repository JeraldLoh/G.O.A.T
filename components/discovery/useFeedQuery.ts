"use client";

import { FILTERS_EVENT, useBrowserValue } from "@/components/discovery/storage";
import { getFilters, getInterests } from "@/lib/local";

/** Query string for /api/feed from kb:interests + kb:filters, e.g. "subjects=science,math&level=beginner". */
export function buildFeedQuery(): string {
  const params = new URLSearchParams();
  const interests = getInterests();
  const { tags, level } = getFilters();
  if (interests?.length) params.set("subjects", interests.join(","));
  if (tags.length) params.set("tags", tags.join(","));
  if (level) params.set("level", level);
  return params.toString();
}

/**
 * The feed's current filter as a query string. null during server render;
 * updates when InterestGate, FilterBar or an upload change anything.
 * Usage: fetch(`/api/feed?${query}`) once query !== null, and refetch when it changes.
 */
export function useFeedQuery(): string | null {
  return useBrowserValue(buildFeedQuery, [FILTERS_EVENT]) ?? null;
}
