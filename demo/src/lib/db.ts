import { neon } from "@neondatabase/serverless";

// Initialize Neon database connection
export const sql = neon(process.env.DATABASE_URL!);

// Initialize database schema
export async function initializeDatabase() {
  try {
    // Create waitlist table with comprehensive data for investors/VCs
    await sql`
      CREATE TABLE IF NOT EXISTS waitlist (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,

        -- Timing data
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

        -- Source tracking (important for investor metrics)
        source VARCHAR(100) DEFAULT 'website',
        referrer TEXT,
        utm_source VARCHAR(100),
        utm_medium VARCHAR(100),
        utm_campaign VARCHAR(100),
        utm_content VARCHAR(100),
        utm_term VARCHAR(100),

        -- User context
        user_agent TEXT,
        ip_address VARCHAR(45),
        country VARCHAR(100),
        city VARCHAR(100),
        region VARCHAR(100),
        timezone VARCHAR(100),

        -- Device info
        device_type VARCHAR(50),
        browser VARCHAR(100),
        os VARCHAR(100),

        -- Engagement tracking
        email_verified BOOLEAN DEFAULT FALSE,
        verification_token VARCHAR(255),
        verification_sent_at TIMESTAMP WITH TIME ZONE,

        -- Status
        status VARCHAR(50) DEFAULT 'pending',
        notes TEXT,

        -- Referral program (for growth metrics)
        referral_code VARCHAR(50) UNIQUE,
        referred_by VARCHAR(50),
        referral_count INTEGER DEFAULT 0
      )
    `;

    // Create index for faster queries
    await sql`CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist(created_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_waitlist_source ON waitlist(source)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_waitlist_country ON waitlist(country)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_waitlist_referral_code ON waitlist(referral_code)`;

    // Create analytics table for tracking page views and conversions
    await sql`
      CREATE TABLE IF NOT EXISTS waitlist_analytics (
        id SERIAL PRIMARY KEY,
        event_type VARCHAR(50) NOT NULL,
        event_data JSONB,
        session_id VARCHAR(255),
        visitor_id VARCHAR(255),
        page_url TEXT,
        referrer TEXT,
        user_agent TEXT,
        ip_address VARCHAR(45),
        country VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON waitlist_analytics(event_type)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON waitlist_analytics(created_at)`;

    // Create payment_links table for payment link feature
    await sql`
      CREATE TABLE IF NOT EXISTS payment_links (
        id VARCHAR(12) PRIMARY KEY,

        -- Creator info
        creator_address VARCHAR(56) NOT NULL,
        creator_email VARCHAR(255),

        -- Payment details
        recipient_address VARCHAR(56) NOT NULL,
        amount VARCHAR(50),
        asset VARCHAR(20) DEFAULT 'XLM',
        memo VARCHAR(28),
        description TEXT,

        -- Expiration
        expires_at TIMESTAMP WITH TIME ZONE,

        -- Status tracking
        status VARCHAR(20) DEFAULT 'active',
        payment_tx_hash VARCHAR(64),
        paid_at TIMESTAMP WITH TIME ZONE,
        paid_amount VARCHAR(50),
        paid_by VARCHAR(56),

        -- Network
        network VARCHAR(20) DEFAULT 'testnet',

        -- Metadata
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

        -- Access tracking
        view_count INTEGER DEFAULT 0,
        last_viewed_at TIMESTAMP WITH TIME ZONE
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_payment_links_creator ON payment_links(creator_address)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_payment_links_status ON payment_links(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_payment_links_created_at ON payment_links(created_at)`;

    // Create daily stats table for quick investor dashboards
    await sql`
      CREATE TABLE IF NOT EXISTS waitlist_daily_stats (
        id SERIAL PRIMARY KEY,
        date DATE UNIQUE NOT NULL,
        total_signups INTEGER DEFAULT 0,
        unique_visitors INTEGER DEFAULT 0,
        conversion_rate DECIMAL(5,2),
        top_source VARCHAR(100),
        top_country VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create payment_streams table for streaming payments
    await sql`
      CREATE TABLE IF NOT EXISTS payment_streams (
        id VARCHAR(16) PRIMARY KEY,

        -- Parties
        sender_address VARCHAR(56) NOT NULL,
        sender_email VARCHAR(255),
        recipient_address VARCHAR(56) NOT NULL,
        recipient_email VARCHAR(255),

        -- Stream parameters
        total_amount DECIMAL(20, 7) NOT NULL,
        asset VARCHAR(20) DEFAULT 'XLM',
        start_time TIMESTAMP WITH TIME ZONE NOT NULL,
        end_time TIMESTAMP WITH TIME ZONE NOT NULL,
        cliff_time TIMESTAMP WITH TIME ZONE,

        -- Calculated rate (amount per second)
        flow_rate DECIMAL(30, 15) NOT NULL,

        -- Streaming curve type
        curve_type VARCHAR(20) DEFAULT 'linear',

        -- State tracking
        status VARCHAR(20) DEFAULT 'pending',
        withdrawn_amount DECIMAL(20, 7) DEFAULT 0,
        last_withdrawal_at TIMESTAMP WITH TIME ZONE,
        cancelled_at TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,

        -- Transaction hashes
        deposit_tx_hash VARCHAR(64),
        last_withdrawal_tx_hash VARCHAR(64),
        cancel_tx_hash VARCHAR(64),

        -- Metadata
        title VARCHAR(100),
        description TEXT,
        memo VARCHAR(28),

        -- Network
        network VARCHAR(20) DEFAULT 'testnet',

        -- Timestamps
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_streams_sender ON payment_streams(sender_address)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_streams_recipient ON payment_streams(recipient_address)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_streams_status ON payment_streams(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_streams_created_at ON payment_streams(created_at)`;

    console.log("Database schema initialized successfully");
    return { success: true };
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}

// Generate a unique referral code
export function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "SR-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Parse user agent for device info
export function parseUserAgent(ua: string | null): {
  deviceType: string;
  browser: string;
  os: string;
} {
  if (!ua) return { deviceType: "unknown", browser: "unknown", os: "unknown" };

  const deviceType = /mobile/i.test(ua)
    ? "mobile"
    : /tablet/i.test(ua)
    ? "tablet"
    : "desktop";

  let browser = "unknown";
  if (/chrome/i.test(ua) && !/edge/i.test(ua)) browser = "Chrome";
  else if (/firefox/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = "Safari";
  else if (/edge/i.test(ua)) browser = "Edge";
  else if (/opera|opr/i.test(ua)) browser = "Opera";

  let os = "unknown";
  if (/windows/i.test(ua)) os = "Windows";
  else if (/macintosh|mac os/i.test(ua)) os = "macOS";
  else if (/linux/i.test(ua)) os = "Linux";
  else if (/android/i.test(ua)) os = "Android";
  else if (/iphone|ipad/i.test(ua)) os = "iOS";

  return { deviceType, browser, os };
}
