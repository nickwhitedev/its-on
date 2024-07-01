import { TIER_10, TIER_100, TIER_25 } from './constants'
import { MS_IN_DAY, MS_IN_HOUR } from './time.ts'

const UPGRADE_STREAK_WINDOW_FOR_ITS_ON_10 = MS_IN_DAY * 7
const UPGRADE_STREAK_WINDOW_FOR_ITS_ON_25 = MS_IN_DAY * 30
const UPGRADE_STREAK_WINDOW_FOR_ITS_ON_100 = MS_IN_DAY * 90

const UPGRADE_STREAK_WINDOW_FOR_ITS_ON_10_STRING = '7 days'
const UPGRADE_STREAK_WINDOW_FOR_ITS_ON_25_STRING = '30 days'
const UPGRADE_STREAK_WINDOW_FOR_ITS_ON_100_STRING = '90 days'

const UPGRADE_REQUIRED_SUBSCRIBER_COUNT_FOR_10 = 4
const UPGRADE_REQUIRED_SUBSCRIBER_COUNT_FOR_25 = 8
const UPGRADE_REQUIRED_SUBSCRIBER_COUNT_FOR_100 = 20

const UPGRADE_MINIMUM_INTERVAL_FOR_10 = MS_IN_HOUR * 12
const UPGRADE_MINIMUM_INTERVAL_FOR_25 = MS_IN_DAY * 5
const UPGRADE_MINIMUM_INTERVAL_FOR_100 = MS_IN_DAY * 23

const UPGRADE_MINIMUM_INTERVAL_FOR_10_STRING = 'day'
const UPGRADE_MINIMUM_INTERVAL_FOR_25_STRING = 'week'
const UPGRADE_MINIMUM_INTERVAL_FOR_100_STRING = 'month'

const UPGRADE_EVENT_COUNT_GOAL_FOR_10 = 3
const UPGRADE_EVENT_COUNT_GOAL_FOR_25 = 4
const UPGRADE_EVENT_COUNT_GOAL_FOR_100 = 3

export const getUpgradeStreakWindowForTier = (tier: number): number => {
  if (tier < TIER_10) {
    return UPGRADE_STREAK_WINDOW_FOR_ITS_ON_10
  }
  if (tier < TIER_25) {
    return UPGRADE_STREAK_WINDOW_FOR_ITS_ON_25
  }
  if (tier < TIER_100) {
    return UPGRADE_STREAK_WINDOW_FOR_ITS_ON_100
  }
  return 0
}

export const getUpgradeStreakWindowStringForTier = (tier: number): string => {
  if (tier < TIER_10) {
    return UPGRADE_STREAK_WINDOW_FOR_ITS_ON_10_STRING
  }
  if (tier < TIER_25) {
    return UPGRADE_STREAK_WINDOW_FOR_ITS_ON_25_STRING
  }
  if (tier < TIER_100) {
    return UPGRADE_STREAK_WINDOW_FOR_ITS_ON_100_STRING
  }
  return ''
}

export const getUpgradeRequiredSubscriberCountForTier = (
  tier: number,
): number => {
  if (tier < TIER_10) {
    return UPGRADE_REQUIRED_SUBSCRIBER_COUNT_FOR_10
  }
  if (tier < TIER_25) {
    return UPGRADE_REQUIRED_SUBSCRIBER_COUNT_FOR_25
  }
  if (tier < TIER_100) {
    return UPGRADE_REQUIRED_SUBSCRIBER_COUNT_FOR_100
  }
  return 0
}

export const getUpgradeMinimumIntervalForTier = (tier: number): number => {
  if (tier < TIER_10) {
    return UPGRADE_MINIMUM_INTERVAL_FOR_10
  }
  if (tier < TIER_25) {
    return UPGRADE_MINIMUM_INTERVAL_FOR_25
  }
  if (tier < TIER_100) {
    return UPGRADE_MINIMUM_INTERVAL_FOR_100
  }
  return 0
}

export const getUpgradeMinimumIntervalStringForTier = (
  tier: number,
): string => {
  if (tier < TIER_10) {
    return UPGRADE_MINIMUM_INTERVAL_FOR_10_STRING
  }
  if (tier < TIER_25) {
    return UPGRADE_MINIMUM_INTERVAL_FOR_25_STRING
  }
  if (tier < TIER_100) {
    return UPGRADE_MINIMUM_INTERVAL_FOR_100_STRING
  }
  return ''
}

export const getUpgradeEventCountGoalForTier = (tier: number): number => {
  if (tier < TIER_10) {
    return UPGRADE_EVENT_COUNT_GOAL_FOR_10
  }
  if (tier < TIER_25) {
    return UPGRADE_EVENT_COUNT_GOAL_FOR_25
  }
  if (tier < TIER_100) {
    return UPGRADE_EVENT_COUNT_GOAL_FOR_100
  }
  return 0
}

export const getUpgradeTierForTier = (tier: number): number | null => {
  if (tier < TIER_10) {
    return TIER_10
  }
  if (tier < TIER_25) {
    return TIER_25
  }
  if (tier < TIER_100) {
    return TIER_100
  }
  return null
}
