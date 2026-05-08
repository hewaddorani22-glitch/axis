"use client";

export type UpgradePromptSource =
  | "generic"
  | "mission_limit"
  | "habit_limit"
  | "revenue_limit"
  | "theme_limit"
  | "review_history"
  | "streak_risk";

export type UpgradePromptDetail = {
  source: UpgradePromptSource;
};

export const UPGRADE_PROMPT_EVENT = "lomoura:upgrade-open";

export function openUpgradePrompt(detail: UpgradePromptDetail) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<UpgradePromptDetail>(UPGRADE_PROMPT_EVENT, {
      detail,
    })
  );
}
