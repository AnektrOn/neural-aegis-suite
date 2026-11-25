/** Free Initiation starter baselines (5 Pulse cards / 5 Toolbox protocols unlocked post-onboarding). */
export const FREE_WEEKLY_TOOLBOX_ITEMS = 5;
export const FREE_ACTIVE_PULSE_CARDS = 5;

/** Initiation daily caps on admin « global » Pulse swipes and Toolbox session starts (UTC). */
export const FREE_DAILY_GLOBAL_PULSE = 5;
export const FREE_DAILY_GLOBAL_TOOLBOX = 5;

export const STRIPE_PRICE_AEGIS_SOLO_MONTHLY = "aegis_solo_monthly";

/** AEGIS Solo delivery baselines (pricing copy + future entitlement checks). */
export const SOLO_WEEKLY_TOOLBOX_ITEMS = 10;
export const SOLO_ACTIVE_PULSE_CARDS = 15;
export const SOLO_LOGOS_QUOTA_MULTIPLIER = 2;

export const SOLO_LOGOS_WEEKLY_TOOLBOX_ITEMS =
  SOLO_WEEKLY_TOOLBOX_ITEMS * SOLO_LOGOS_QUOTA_MULTIPLIER;
export const SOLO_LOGOS_ACTIVE_PULSE_CARDS =
  SOLO_ACTIVE_PULSE_CARDS * SOLO_LOGOS_QUOTA_MULTIPLIER;

export const STRIPE_PRICE_AEGIS_SOLO_LOGOS_MONTHLY = "aegis_solo_logos_monthly";
export const STRIPE_PRICE_AEGIS_LOGOS_AMBASSADOR_MONTHLY = "aegis_logos_ambassador_monthly";

export const LOGOS_AMBASSADOR_PRICE_EUR = 130;
export const LOGOS_FUTURE_PRICE_EUR = 170;
export const LOGOS_VOICE_MINUTES_MONTHLY = 90;