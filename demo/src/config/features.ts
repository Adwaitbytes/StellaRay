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
  WAITLIST_MODE: true,

  /**
   * Show "Coming Soon" badges on features
   */
  SHOW_COMING_SOON: true,

  /**
   * Enable mainnet (set false during testing phase)
   */
  MAINNET_ENABLED: true,

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
   * Fake waitlist count for social proof (before real data)
   */
  INITIAL_WAITLIST_COUNT: 847,
} as const;

// Type for feature keys
export type FeatureKey = keyof typeof FEATURES;

// Helper to check if a boolean feature is enabled
export function isFeatureEnabled(feature: Exclude<FeatureKey, 'INITIAL_WAITLIST_COUNT'>): boolean {
  return FEATURES[feature] as boolean;
}

// Helper to get numeric feature values
export function getFeatureValue(feature: 'INITIAL_WAITLIST_COUNT'): number {
  return FEATURES[feature];
}
