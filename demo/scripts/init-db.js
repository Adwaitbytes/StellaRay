// Database initialization script
// Run with: node scripts/init-db.js

const { neon } = require("@neondatabase/serverless");
require("dotenv").config({ path: ".env.local" });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not found in environment variables");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function initializeDatabase() {
  console.log("🚀 Initializing Stellaray database...\n");

  try {
    // Create waitlist table
    console.log("📋 Creating waitlist table...");
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

        -- Referral program
        referral_code VARCHAR(50) UNIQUE,
        referred_by VARCHAR(50),
        referral_count INTEGER DEFAULT 0
      )
    `;
    console.log("   ✅ waitlist table created");

    // Create indexes
    console.log("\n📊 Creating indexes...");
    await sql`CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist(created_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_waitlist_source ON waitlist(source)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_waitlist_country ON waitlist(country)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_waitlist_referral_code ON waitlist(referral_code)`;
    console.log("   ✅ Indexes created");

    // Create analytics table
    console.log("\n📈 Creating analytics table...");
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
    console.log("   ✅ waitlist_analytics table created");

    await sql`CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON waitlist_analytics(event_type)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON waitlist_analytics(created_at)`;
    console.log("   ✅ Analytics indexes created");

    // Create daily stats table
    console.log("\n📅 Creating daily stats table...");
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
    console.log("   ✅ waitlist_daily_stats table created");

    console.log("\n✨ Database initialization complete!\n");
    console.log("Tables created:");
    console.log("  - waitlist (stores all signups)");
    console.log("  - waitlist_analytics (tracks events)");
    console.log("  - waitlist_daily_stats (aggregated metrics)");
    console.log("\nYour waitlist is ready to collect emails! 🎉\n");

  } catch (error) {
    console.error("\n❌ Error initializing database:", error.message);
    process.exit(1);
  }
}

initializeDatabase();
