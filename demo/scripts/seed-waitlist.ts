/**
 * StellaRay Waitlist Seed Script
 *
 * Generates ~2000 realistic waitlist entries with:
 * - 80% Indian users
 * - 20% International users
 * - Realistic email patterns
 * - Natural timestamp distribution
 * - Organic referral patterns
 *
 * Run with: npm run seed:waitlist
 * Or: npx tsx scripts/seed-waitlist.ts
 */

import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

// Database connection
const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL or POSTGRES_URL environment variable is required');
  console.log('\nMake sure you have .env.local or .env file with:');
  console.log('DATABASE_URL=postgres://...');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

// ============================================
// INDIAN NAMES DATABASE (80% of entries)
// ============================================

const indianFirstNamesMale = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
  'Shaurya', 'Atharva', 'Advait', 'Pranav', 'Aayan', 'Darsh', 'Veer', 'Raj', 'Arnav', 'Dhruv',
  'Kabir', 'Ritvik', 'Aarush', 'Kian', 'Parth', 'Shivansh', 'Rudra', 'Vedant', 'Yash', 'Rohan',
  'Aryan', 'Harsh', 'Sahil', 'Kunal', 'Nikhil', 'Rahul', 'Vikram', 'Siddharth', 'Ankit', 'Ravi',
  'Amit', 'Suresh', 'Rajesh', 'Manoj', 'Vijay', 'Ajay', 'Deepak', 'Gaurav', 'Himanshu', 'Karan',
  'Mohit', 'Neeraj', 'Pankaj', 'Prashant', 'Rakesh', 'Sandeep', 'Tarun', 'Umesh', 'Varun', 'Yogesh',
  'Abhishek', 'Akshay', 'Aman', 'Anand', 'Ashish', 'Bharat', 'Chetan', 'Devendra', 'Dinesh', 'Ganesh',
  'Harish', 'Jatin', 'Kapil', 'Lalit', 'Manish', 'Naveen', 'Om', 'Praveen', 'Sachin', 'Tushar',
  'Vikas', 'Aakash', 'Abhinav', 'Ajit', 'Alok', 'Ankur', 'Atul', 'Chirag', 'Dheeraj', 'Girish',
  'Hemant', 'Jayesh', 'Kamal', 'Lokesh', 'Mukesh', 'Naresh', 'Paresh', 'Ramesh', 'Shekhar', 'Sunil',
  'Tanmay', 'Uday', 'Vinay', 'Yashwant', 'Arun', 'Balaji', 'Chandran', 'Dhanush', 'Eshan', 'Farhan',
  'Gopal', 'Hari', 'Ishan', 'Jagdish', 'Kishore', 'Lakshman', 'Madhav', 'Narayan', 'Omkar', 'Prem',
  'Rishabh', 'Shubham', 'Tejas', 'Utkarsh', 'Vishal', 'Yuvraj', 'Zeeshan', 'Avinash', 'Brijesh', 'Dev'
];

const indianFirstNamesFemale = [
  'Aadhya', 'Aanya', 'Ananya', 'Aarohi', 'Diya', 'Myra', 'Sara', 'Priya', 'Aisha', 'Kiara',
  'Navya', 'Avni', 'Ira', 'Kavya', 'Siya', 'Riya', 'Shanaya', 'Tanya', 'Trisha', 'Zara',
  'Aditi', 'Anushka', 'Bhavna', 'Chitra', 'Deepika', 'Ekta', 'Fatima', 'Gauri', 'Harini', 'Ishita',
  'Jaya', 'Kavitha', 'Lakshmi', 'Meera', 'Nidhi', 'Pallavi', 'Rashmi', 'Sakshi', 'Tanvi', 'Urmi',
  'Vaishali', 'Yamini', 'Neha', 'Pooja', 'Shreya', 'Sneha', 'Swati', 'Divya', 'Komal', 'Mansi',
  'Nikita', 'Payal', 'Radhika', 'Sangeeta', 'Sunita', 'Vandana', 'Anjali', 'Bhavika', 'Chhaya', 'Damini',
  'Garima', 'Heena', 'Jyoti', 'Kalpana', 'Madhuri', 'Namrata', 'Poonam', 'Rekha', 'Shilpa', 'Tejaswini',
  'Uma', 'Vidya', 'Yashika', 'Aakriti', 'Bhagyashree', 'Chandni', 'Diksha', 'Esha', 'Falguni', 'Geetika',
  'Hema', 'Indira', 'Janvi', 'Khushi', 'Lata', 'Mamta', 'Naina', 'Padma', 'Rachna', 'Shalini',
  'Tara', 'Usha', 'Varsha', 'Yamuna', 'Archana', 'Bindu', 'Charvi', 'Drishti', 'Eksha', 'Farha',
  'Simran', 'Preeti', 'Kajal', 'Suman', 'Aarti', 'Megha', 'Ritika', 'Sanjana', 'Vibha', 'Yukti'
];

const indianLastNames = [
  'Sharma', 'Verma', 'Patel', 'Gupta', 'Singh', 'Kumar', 'Rao', 'Reddy', 'Iyer', 'Nair',
  'Joshi', 'Agarwal', 'Banerjee', 'Chatterjee', 'Mukherjee', 'Das', 'Ghosh', 'Sen', 'Bose', 'Roy',
  'Chopra', 'Kapoor', 'Malhotra', 'Khanna', 'Mehra', 'Sethi', 'Bhatia', 'Kohli', 'Arora', 'Dhawan',
  'Pillai', 'Menon', 'Krishnan', 'Venkatesh', 'Subramaniam', 'Raghavan', 'Narayanan', 'Srinivasan', 'Raman', 'Padmanabhan',
  'Desai', 'Shah', 'Mehta', 'Gandhi', 'Prajapati', 'Trivedi', 'Pandey', 'Mishra', 'Tiwari', 'Dubey',
  'Bajaj', 'Bahl', 'Bhalla', 'Chawla', 'Dua', 'Goel', 'Jain', 'Khurana', 'Luthra', 'Nagpal',
  'Oberoi', 'Pahwa', 'Sachdev', 'Sahni', 'Soni', 'Taneja', 'Vohra', 'Walia', 'Yadav', 'Chauhan',
  'Thakur', 'Rawat', 'Negi', 'Bisht', 'Pandit', 'Kaushik', 'Saxena', 'Srivastava', 'Awasthi', 'Dwivedi',
  'Hegde', 'Shetty', 'Pai', 'Kulkarni', 'Deshpande', 'Jog', 'Patil', 'Shinde', 'Jadhav', 'More',
  'Pawar', 'Sawant', 'Thakkar', 'Vyas', 'Modi', 'Parikh', 'Dave', 'Bhatt', 'Raval', 'Solanki',
  'Choudhary', 'Rajput', 'Rathore', 'Bhandari', 'Khatri', 'Ahuja', 'Grover', 'Mittal', 'Singhal', 'Rastogi'
];

// ============================================
// INTERNATIONAL NAMES DATABASE (20% of entries)
// ============================================

const internationalFirstNamesMale = [
  'James', 'Michael', 'Robert', 'David', 'William', 'John', 'Daniel', 'Matthew', 'Christopher', 'Andrew',
  'Alexander', 'Benjamin', 'Ethan', 'Jacob', 'Noah', 'Lucas', 'Mason', 'Oliver', 'Sebastian', 'Henry',
  'Mohammed', 'Ahmed', 'Omar', 'Ali', 'Hassan', 'Ibrahim', 'Yusuf', 'Khalid', 'Tariq', 'Zaid',
  'Wei', 'Chen', 'Li', 'Jun', 'Ming', 'Hao', 'Jian', 'Lei', 'Feng', 'Tao',
  'Hiroshi', 'Takeshi', 'Kenji', 'Yuki', 'Haruki', 'Daiki', 'Riku', 'Sota', 'Kento', 'Yuto',
  'Carlos', 'Miguel', 'Diego', 'Luis', 'Jose', 'Antonio', 'Pablo', 'Alejandro', 'Sergio', 'Fernando',
  'Pierre', 'Jean', 'Louis', 'Marc', 'Antoine', 'Thomas', 'Nicolas', 'Julien', 'Maxime', 'Alexandre',
  'Hans', 'Klaus', 'Wolfgang', 'Stefan', 'Martin', 'Andreas', 'Tobias', 'Felix', 'Lukas', 'Maximilian',
  'Dmitri', 'Alexei', 'Sergei', 'Ivan', 'Nikolai', 'Vladimir', 'Andrei', 'Pavel', 'Mikhail', 'Viktor',
  'Ryan', 'Kevin', 'Brian', 'Patrick', 'Sean', 'Connor', 'Liam', 'Aiden', 'Dylan', 'Tyler'
];

const internationalFirstNamesFemale = [
  'Emma', 'Olivia', 'Ava', 'Sophia', 'Isabella', 'Mia', 'Charlotte', 'Amelia', 'Harper', 'Evelyn',
  'Sarah', 'Jessica', 'Emily', 'Rachel', 'Hannah', 'Michelle', 'Lauren', 'Ashley', 'Samantha', 'Jennifer',
  'Fatima', 'Aisha', 'Layla', 'Maryam', 'Nour', 'Mariam', 'Hana', 'Zainab', 'Amira', 'Yasmin',
  'Mei', 'Xiu', 'Ling', 'Yan', 'Hui', 'Fang', 'Jing', 'Yue', 'Zhen', 'Xia',
  'Yuki', 'Sakura', 'Aiko', 'Miki', 'Emi', 'Keiko', 'Yumi', 'Nanami', 'Haruka', 'Kaori',
  'Maria', 'Sofia', 'Valentina', 'Camila', 'Lucia', 'Elena', 'Ana', 'Paula', 'Daniela', 'Gabriela',
  'Marie', 'Sophie', 'Camille', 'Lea', 'Manon', 'Chloe', 'Clara', 'Alice', 'Julie', 'Laura',
  'Anna', 'Lena', 'Lisa', 'Leonie', 'Julia', 'Nina', 'Elisa', 'Luisa', 'Johanna', 'Katharina',
  'Anastasia', 'Natasha', 'Olga', 'Irina', 'Ekaterina', 'Marina', 'Elena', 'Tatiana', 'Svetlana', 'Daria',
  'Caitlin', 'Siobhan', 'Aoife', 'Niamh', 'Ciara', 'Grace', 'Lily', 'Ruby', 'Ella', 'Isla'
];

const internationalLastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia', 'Rodriguez', 'Wilson',
  'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Hernandez', 'Moore', 'Martin', 'Jackson', 'Thompson', 'White',
  'Al-Hassan', 'Al-Rashid', 'Al-Farsi', 'Mansour', 'Nasser', 'Khalil', 'Haddad', 'Amin', 'Saleh', 'Bakr',
  'Chen', 'Wang', 'Li', 'Zhang', 'Liu', 'Yang', 'Huang', 'Wu', 'Zhou', 'Xu',
  'Tanaka', 'Suzuki', 'Yamamoto', 'Watanabe', 'Ito', 'Nakamura', 'Kobayashi', 'Kato', 'Yoshida', 'Yamada',
  'Santos', 'Ferreira', 'Costa', 'Oliveira', 'Pereira', 'Silva', 'Almeida', 'Carvalho', 'Gomes', 'Lima',
  'Dubois', 'Moreau', 'Laurent', 'Simon', 'Michel', 'Lefebvre', 'Leroy', 'Roux', 'Bernard', 'Bertrand',
  'Mueller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann',
  'Ivanov', 'Petrov', 'Sidorov', 'Smirnov', 'Kuznetsov', 'Popov', 'Sokolov', 'Lebedev', 'Kozlov', 'Novikov',
  'Murphy', 'Kelly', 'Sullivan', 'Walsh', 'Ryan', 'OBrien', 'McCarthy', 'Byrne', 'Collins', 'Doyle'
];

// ============================================
// EMAIL DOMAIN PATTERNS (Weighted)
// ============================================

const emailDomains = [
  // Gmail dominates (50%)
  'gmail.com', 'gmail.com', 'gmail.com', 'gmail.com', 'gmail.com',
  // Yahoo (15%)
  'yahoo.com', 'yahoo.in', 'yahoo.co.in',
  // Outlook/Hotmail (15%)
  'outlook.com', 'hotmail.com', 'live.com',
  // Others (20%)
  'protonmail.com',
  'icloud.com',
  'rediffmail.com',
  'mail.com',
  'zoho.com',
  'yandex.com',
  'aol.com',
];

// ============================================
// SOURCE PATTERNS (Where users came from)
// ============================================

const sources = [
  'website', 'website', 'website', 'website', // Direct (40%)
  'twitter', 'twitter', 'twitter',  // Twitter (15%)
  'discord', 'discord',              // Discord (10%)
  'telegram',                         // Telegram (5%)
  'reddit',                           // Reddit (5%)
  'google',                           // Search (5%)
  'linkedin',                         // LinkedIn (5%)
  'youtube',                          // YouTube (5%)
  'referral', 'referral',            // Referral (10%)
];

// ============================================
// UTM CAMPAIGNS
// ============================================

const utmCampaigns = [
  null, null, null, null, null, null, // 60% no UTM
  'launch_2024', 'early_access', 'waitlist_v2', 'crypto_twitter',
  'stellar_discord', 'web3_builders', 'defi_users', 'zk_curious'
];

const utmSources = [
  null, null, null, null, // 40% no UTM source
  'twitter', 'discord', 'telegram', 'reddit', 'youtube', 'linkedin', 'newsletter'
];

const utmMediums = [
  null, null, null,
  'social', 'organic', 'referral', 'cpc', 'email', 'banner'
];

// ============================================
// BROWSER & DEVICE DATA
// ============================================

const browsers = [
  'Chrome', 'Chrome', 'Chrome', 'Chrome', 'Chrome', // 50%
  'Safari', 'Safari',                                // 20%
  'Firefox',                                          // 10%
  'Edge',                                             // 10%
  'Opera', 'Brave'                                   // 10%
];

const operatingSystems = [
  'Windows', 'Windows', 'Windows',    // 30%
  'macOS', 'macOS',                    // 20%
  'Android', 'Android', 'Android',     // 30%
  'iOS', 'iOS',                        // 20%
];

const deviceTypes = [
  'mobile', 'mobile', 'mobile', 'mobile', // 40%
  'desktop', 'desktop', 'desktop',        // 30%
  'tablet'                                 // 10%
];

// ============================================
// LOCATION DATA
// ============================================

const indianCities = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad',
  'Jaipur', 'Lucknow', 'Surat', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal',
  'Visakhapatnam', 'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad',
  'Meerut', 'Rajkot', 'Varanasi', 'Srinagar', 'Aurangabad', 'Dhanbad', 'Amritsar', 'Allahabad',
  'Ranchi', 'Howrah', 'Coimbatore', 'Jabalpur', 'Gwalior', 'Vijayawada', 'Jodhpur', 'Madurai',
  'Raipur', 'Kota', 'Chandigarh', 'Guwahati', 'Solapur', 'Hubli', 'Mysore', 'Tiruchirappalli',
  'Bareilly', 'Aligarh', 'Tiruppur', 'Moradabad', 'Jalandhar', 'Bhubaneswar', 'Salem', 'Warangal',
  'Guntur', 'Bhiwandi', 'Saharanpur', 'Gorakhpur', 'Bikaner', 'Amravati', 'Noida', 'Jamshedpur'
];

const indianRegions = [
  'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Uttar Pradesh', 'Gujarat', 'Rajasthan',
  'West Bengal', 'Andhra Pradesh', 'Telangana', 'Kerala', 'Madhya Pradesh', 'Bihar',
  'Punjab', 'Haryana', 'Delhi', 'Odisha', 'Jharkhand', 'Assam', 'Chhattisgarh', 'Uttarakhand'
];

const internationalLocations = [
  { country: 'United States', cities: ['New York', 'San Francisco', 'Los Angeles', 'Chicago', 'Austin', 'Seattle', 'Boston', 'Miami'], region: 'California' },
  { country: 'United Kingdom', cities: ['London', 'Manchester', 'Birmingham', 'Bristol', 'Leeds'], region: 'England' },
  { country: 'Singapore', cities: ['Singapore'], region: 'Central' },
  { country: 'United Arab Emirates', cities: ['Dubai', 'Abu Dhabi'], region: 'Dubai' },
  { country: 'Canada', cities: ['Toronto', 'Vancouver', 'Montreal', 'Calgary'], region: 'Ontario' },
  { country: 'Australia', cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth'], region: 'New South Wales' },
  { country: 'Germany', cities: ['Berlin', 'Munich', 'Frankfurt', 'Hamburg'], region: 'Bavaria' },
  { country: 'Netherlands', cities: ['Amsterdam', 'Rotterdam', 'Utrecht'], region: 'North Holland' },
  { country: 'Japan', cities: ['Tokyo', 'Osaka', 'Kyoto'], region: 'Kanto' },
  { country: 'South Korea', cities: ['Seoul', 'Busan'], region: 'Seoul' },
];

const internationalTimezones = [
  'America/New_York', 'America/Los_Angeles', 'America/Chicago',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin',
  'Asia/Singapore', 'Asia/Dubai', 'Asia/Tokyo',
  'Australia/Sydney', 'America/Toronto'
];

// ============================================
// HELPER FUNCTIONS
// ============================================

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateIndianName(): { firstName: string; lastName: string } {
  const isMale = Math.random() > 0.42;
  const firstName = isMale
    ? randomElement(indianFirstNamesMale)
    : randomElement(indianFirstNamesFemale);
  const lastName = randomElement(indianLastNames);
  return { firstName, lastName };
}

function generateInternationalName(): { firstName: string; lastName: string } {
  const isMale = Math.random() > 0.42;
  const firstName = isMale
    ? randomElement(internationalFirstNamesMale)
    : randomElement(internationalFirstNamesFemale);
  const lastName = randomElement(internationalLastNames);
  return { firstName, lastName };
}

function generateEmail(firstName: string, lastName: string): string {
  const domain = randomElement(emailDomains);
  const year = randomNumber(1985, 2004);
  const num = randomNumber(1, 999);

  const patterns = [
    `${firstName.toLowerCase()}${lastName.toLowerCase()}`,
    `${firstName.toLowerCase()}.${lastName.toLowerCase()}`,
    `${firstName.toLowerCase()}${num}`,
    `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomNumber(1, 99)}`,
    `${firstName.toLowerCase()[0]}${lastName.toLowerCase()}`,
    `${firstName.toLowerCase()}_${lastName.toLowerCase()}`,
    `${lastName.toLowerCase()}.${firstName.toLowerCase()}`,
    `${firstName.toLowerCase()}${lastName.toLowerCase().slice(0, 3)}`,
    `${firstName.toLowerCase()}${year}`,
    `${firstName.toLowerCase()}.${lastName.toLowerCase()[0]}${randomNumber(10, 99)}`,
    `${firstName.toLowerCase()}${lastName.toLowerCase()}${randomNumber(1, 9)}`,
    `${lastName.toLowerCase()}${firstName.toLowerCase()[0]}`,
  ];

  const emailBase = randomElement(patterns);
  return `${emailBase}@${domain}`.replace(/[^a-z0-9.@_-]/g, '');
}

function generateTimestamp(): Date {
  const now = new Date();
  const daysAgo = Math.floor(Math.pow(Math.random(), 1.8) * 60);
  const hoursAgo = randomNumber(0, 23);
  const minutesAgo = randomNumber(0, 59);
  const secondsAgo = randomNumber(0, 59);

  const timestamp = new Date(now);
  timestamp.setDate(timestamp.getDate() - daysAgo);
  timestamp.setHours(now.getHours() - hoursAgo);
  timestamp.setMinutes(now.getMinutes() - minutesAgo);
  timestamp.setSeconds(secondsAgo);

  return timestamp;
}

function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'SR-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function generateUserAgent(browser: string, os: string): string {
  const chromeVersion = randomNumber(100, 120);
  const safariVersion = randomNumber(15, 17);
  const firefoxVersion = randomNumber(100, 120);

  if (browser === 'Chrome' && os === 'Windows') {
    return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion}.0.0.0 Safari/537.36`;
  } else if (browser === 'Chrome' && os === 'macOS') {
    return `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion}.0.0.0 Safari/537.36`;
  } else if (browser === 'Safari') {
    return `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${safariVersion}.0 Safari/605.1.15`;
  } else if (browser === 'Chrome' && os === 'Android') {
    return `Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion}.0.0.0 Mobile Safari/537.36`;
  } else if (os === 'iOS') {
    return `Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${safariVersion}.0 Mobile/15E148 Safari/604.1`;
  } else if (browser === 'Firefox') {
    return `Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:${firefoxVersion}.0) Gecko/20100101 Firefox/${firefoxVersion}.0`;
  } else if (browser === 'Edge') {
    return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion}.0.0.0 Safari/537.36 Edg/${chromeVersion}.0.0.0`;
  }
  return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion}.0.0.0 Safari/537.36`;
}

function generateIPAddress(): string {
  return `${randomNumber(1, 223)}.${randomNumber(0, 255)}.${randomNumber(0, 255)}.${randomNumber(1, 254)}`;
}

interface WaitlistEntry {
  email: string;
  created_at: Date;
  source: string;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  user_agent: string;
  ip_address: string;
  country: string;
  city: string;
  region: string;
  timezone: string;
  device_type: string;
  browser: string;
  os: string;
  email_verified: boolean;
  status: string;
  referral_code: string;
  referred_by: string | null;
}

function generateEntry(isIndian: boolean): WaitlistEntry {
  const nameData = isIndian ? generateIndianName() : generateInternationalName();
  const email = generateEmail(nameData.firstName, nameData.lastName);

  const browser = randomElement(browsers);
  const os = randomElement(operatingSystems);
  const deviceType = randomElement(deviceTypes);

  let country: string, city: string, region: string, timezone: string;

  if (isIndian) {
    country = 'India';
    city = randomElement(indianCities);
    region = randomElement(indianRegions);
    timezone = 'Asia/Kolkata';
  } else {
    const loc = randomElement(internationalLocations);
    country = loc.country;
    city = randomElement(loc.cities);
    region = loc.region;
    timezone = randomElement(internationalTimezones);
  }

  const source = randomElement(sources);
  const hasReferrer = Math.random() > 0.6;
  const hasUtm = Math.random() > 0.5;

  const referrers = ['twitter.com', 'discord.com', 'reddit.com', 'google.com', 't.me', 'linkedin.com'];

  return {
    email,
    created_at: generateTimestamp(),
    source,
    referrer: hasReferrer ? `https://${randomElement(referrers)}/...` : null,
    utm_source: hasUtm ? randomElement(utmSources) : null,
    utm_medium: hasUtm ? randomElement(utmMediums) : null,
    utm_campaign: hasUtm ? randomElement(utmCampaigns) : null,
    user_agent: generateUserAgent(browser, os),
    ip_address: generateIPAddress(),
    country,
    city,
    region,
    timezone,
    device_type: deviceType,
    browser,
    os,
    email_verified: Math.random() > 0.12,
    status: Math.random() > 0.95 ? 'pending' : 'active',
    referral_code: generateReferralCode(),
    referred_by: Math.random() > 0.85 ? generateReferralCode() : null,
  };
}

// ============================================
// MAIN EXECUTION
// ============================================

async function seedWaitlist() {
  console.log('\n🚀 StellaRay Waitlist Seed Script\n');
  console.log('━'.repeat(50));

  const TARGET_COUNT = 2000;
  const INDIAN_PERCENTAGE = 0.80;
  const BATCH_SIZE = 50;

  const indianCount = Math.floor(TARGET_COUNT * INDIAN_PERCENTAGE);
  const internationalCount = TARGET_COUNT - indianCount;

  console.log(`\n📊 Target Distribution:`);
  console.log(`   • Indian entries: ${indianCount} (${INDIAN_PERCENTAGE * 100}%)`);
  console.log(`   • International entries: ${internationalCount} (${(1 - INDIAN_PERCENTAGE) * 100}%)`);
  console.log(`   • Total: ${TARGET_COUNT}\n`);

  console.log('📝 Generating entries...');
  const entries: WaitlistEntry[] = [];

  for (let i = 0; i < indianCount; i++) {
    entries.push(generateEntry(true));
  }

  for (let i = 0; i < internationalCount; i++) {
    entries.push(generateEntry(false));
  }

  // Shuffle entries
  for (let i = entries.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [entries[i], entries[j]] = [entries[j], entries[i]];
  }

  // Sort by created_at
  entries.sort((a, b) => a.created_at.getTime() - b.created_at.getTime());

  console.log(`   ✓ Generated ${entries.length} entries\n`);
  console.log('💾 Inserting into database...\n');

  let inserted = 0;
  let duplicates = 0;
  let errors = 0;

  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);

    for (const entry of batch) {
      try {
        await sql`
          INSERT INTO waitlist (
            email, created_at, source, referrer,
            utm_source, utm_medium, utm_campaign,
            user_agent, ip_address, country, city, region, timezone,
            device_type, browser, os,
            email_verified, status, referral_code, referred_by
          ) VALUES (
            ${entry.email},
            ${entry.created_at.toISOString()},
            ${entry.source},
            ${entry.referrer},
            ${entry.utm_source},
            ${entry.utm_medium},
            ${entry.utm_campaign},
            ${entry.user_agent},
            ${entry.ip_address},
            ${entry.country},
            ${entry.city},
            ${entry.region},
            ${entry.timezone},
            ${entry.device_type},
            ${entry.browser},
            ${entry.os},
            ${entry.email_verified},
            ${entry.status},
            ${entry.referral_code},
            ${entry.referred_by}
          )
          ON CONFLICT (email) DO NOTHING
        `;
        inserted++;
      } catch (error: any) {
        if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
          duplicates++;
        } else {
          errors++;
          if (errors < 5) {
            console.error(`   ⚠️ Error: ${error.message?.slice(0, 80)}`);
          }
        }
      }
    }

    const progress = Math.min(100, Math.round(((i + BATCH_SIZE) / entries.length) * 100));
    const bar = '█'.repeat(Math.floor(progress / 5)) + '░'.repeat(20 - Math.floor(progress / 5));
    process.stdout.write(`\r   [${bar}] ${progress}% | ${inserted} inserted`);
  }

  console.log('\n\n' + '━'.repeat(50));
  console.log('✅ Seeding Complete!\n');

  try {
    const stats = await sql`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE country = 'India') as indian,
        COUNT(*) FILTER (WHERE email_verified = true) as verified,
        COUNT(*) FILTER (WHERE referred_by IS NOT NULL) as referred,
        COUNT(DISTINCT country) as countries,
        MIN(created_at) as first_signup,
        MAX(created_at) as latest_signup
      FROM waitlist
    `;

    const topCountries = await sql`
      SELECT country, COUNT(*) as count
      FROM waitlist
      GROUP BY country
      ORDER BY count DESC
      LIMIT 5
    `;

    console.log('📊 Database Statistics:\n');
    console.log(`   Total Waitlist Entries: ${stats[0].total}`);
    console.log(`   Indian Users: ${stats[0].indian} (${Math.round(stats[0].indian / stats[0].total * 100)}%)`);
    console.log(`   Verified Emails: ${stats[0].verified} (${Math.round(stats[0].verified / stats[0].total * 100)}%)`);
    console.log(`   Referred Users: ${stats[0].referred}`);
    console.log(`   Countries: ${stats[0].countries}`);
    console.log(`   First Signup: ${new Date(stats[0].first_signup).toLocaleDateString()}`);
    console.log(`   Latest Signup: ${new Date(stats[0].latest_signup).toLocaleDateString()}`);

    console.log('\n   Top Countries:');
    topCountries.forEach((row: any, i: number) => {
      console.log(`   ${i + 1}. ${row.country}: ${row.count}`);
    });

  } catch (error) {
    console.log('   (Could not fetch stats)');
  }

  console.log('\n' + '━'.repeat(50));
  console.log('🎉 Your waitlist now looks organic and authentic!\n');
}

seedWaitlist()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
