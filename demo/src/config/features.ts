/**
 * Feature Flags Configuration
 *
 * Toggle features on/off for different launch phases.
 *
 * WAITLIST_MODE:
 *   - true:  Users see waitlist page instead of signing in
 *   - false: Normal sign-in flow with Google OAuth
 */

export const FEATURES = {
  // ========================================
  // 🚀 LAUNCH CONTROL
  // ========================================

  /**
   * Enable waitlist mode before public launch
   * Set to false when ready to go live
   */
  WAITLIST_MODE: false,

  /**
   * Show "Coming Soon" badges on features
   */
  SHOW_COMING_SOON: true,

  /**
   * Enable mainnet (set false during testing phase)
   */
  MAINNET_ENABLED: true,

  /**
   * Enable quests/rewards page
   * Set to false to hide quest links and CTAs
   */
  QUESTS_ENABLED: true,

  // ========================================
  // 📊 ANALYTICS & TRACKING
  // ========================================

  /**
   * Collect waitlist emails (requires backend)
   */
  COLLECT_EMAILS: true,

  // ========================================
  // 🎨 UI FEATURES
  // ========================================

  /**
   * Show social proof numbers on waitlist
   */
  SHOW_WAITLIST_COUNT: true,

  /**
   * Initial waitlist count for social proof (before real data)
   * This is just the base - real count from DB is added on top
   */
  INITIAL_WAITLIST_COUNT: 20,

  /**
   * Auto-increment amount (for simulation)
   */
  WAITLIST_INCREMENT_AMOUNT: 2,

  /**
   * Auto-increment interval in milliseconds (2 minutes = 120000)
   */
  WAITLIST_INCREMENT_INTERVAL: 120000,

  // ========================================
  // ✨ WAITLIST PAGE ENHANCEMENTS
  // ========================================

  /**
   * Enable confetti animation on successful signup
   */
  WAITLIST_CONFETTI: true,

  /** 
   * Enable floating background orbs animation
   */
  WAITLIST_FLOATING_ORBS: false,

  /**
   * Enable typewriter effect on headline
   */
  WAITLIST_TYPEWRITER: true,

  /**
   * Enable success modal popup after signup
   */
  WAITLIST_SUCCESS_MODAL: true,

  /**
   * Enable particle field background
   */
  WAITLIST_PARTICLES: false,

  /**
   * Enable animated counter for social proof
   */
  WAITLIST_ANIMATED_COUNTER: true,

  /**
   * Show stats row (Countries, Setup Time, etc.)
   */
  WAITLIST_SHOW_STATS: true,

  /**
   * Auto-increment waitlist count for social proof simulation
   */
  WAITLIST_AUTO_INCREMENT: true
} as const;

// Type for feature keys
export type FeatureKey = keyof typeof FEATURES;

// Boolean feature keys
export type BooleanFeatureKey = {
  [K in FeatureKey]: typeof FEATURES[K] extends boolean ? K : never;
}[FeatureKey];

// Numeric feature keys
export type NumericFeatureKey = {
  [K in FeatureKey]: typeof FEATURES[K] extends number ? K : never;
}[FeatureKey];

// Helper to check if a boolean feature is enabled
export function isFeatureEnabled(feature: BooleanFeatureKey): boolean {
  return FEATURES[feature] as boolean;
}

// Helper to get numeric feature values
export function getFeatureValue(feature: NumericFeatureKey): number {
  return FEATURES[feature] as number;
}
