/**
 * StellaRay Comprehensive Seed Script
 *
 * Seeds BOTH tables:
 *   - waitlist          → 3100 entries (80% Indian)
 *   - authenticated_users → 2000 entries (80% Indian)
 *
 * All data is hyper-realistic: human timestamps, organic email patterns,
 * believable login counts, real Stellar-format wallet addresses, etc.
 *
 * Run: npx tsx scripts/seed-all.ts
 */

import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import * as crypto from 'crypto';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is required in .env.local');
  process.exit(1);
}
const sql = neon(DATABASE_URL);

// ─── helpers ────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function weightedPick<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

// ─── Indian first names (male) ──────────────────────────────────

const indianMale = [
  'Aarav','Vivaan','Aditya','Vihaan','Arjun','Sai','Reyansh','Ayaan','Krishna','Ishaan',
  'Shaurya','Atharva','Advait','Pranav','Darsh','Veer','Raj','Arnav','Dhruv','Kabir',
  'Ritvik','Parth','Shivansh','Rudra','Vedant','Yash','Rohan','Aryan','Harsh','Sahil',
  'Kunal','Nikhil','Rahul','Vikram','Siddharth','Ankit','Ravi','Amit','Rajesh','Manoj',
  'Vijay','Ajay','Deepak','Gaurav','Himanshu','Karan','Mohit','Neeraj','Pankaj','Prashant',
  'Rakesh','Sandeep','Tarun','Varun','Yogesh','Abhishek','Akshay','Aman','Anand','Ashish',
  'Bharat','Chetan','Dinesh','Ganesh','Harish','Jatin','Kapil','Lalit','Manish','Naveen',
  'Om','Praveen','Sachin','Tushar','Vikas','Aakash','Abhinav','Alok','Ankur','Atul',
  'Chirag','Dheeraj','Girish','Hemant','Jayesh','Kamal','Lokesh','Mukesh','Naresh','Paresh',
  'Ramesh','Shekhar','Sunil','Tanmay','Uday','Vinay','Arun','Dhanush','Eshan','Farhan',
  'Gopal','Hari','Ishan','Kishore','Madhav','Narayan','Omkar','Prem','Rishabh','Shubham',
  'Tejas','Utkarsh','Vishal','Yuvraj','Avinash','Dev','Kartik','Shreyas','Soham','Aniket',
  'Ritesh','Sourav','Mayank','Sameer','Rohit','Nitin','Sumit','Anil','Sudhir','Rajat',
  'Saurabh','Vivek','Prakash','Girija','Nishant','Mihir','Arpit','Pushkar','Sushant','Raghav',
  'Akhil','Ashwin','Sanjay','Ajinkya','Pratik','Tushar','Pranay','Yatin','Jaidev','Harshit',
];

// ─── Indian first names (female) ────────────────────────────────

const indianFemale = [
  'Aadhya','Aanya','Ananya','Aarohi','Diya','Myra','Sara','Priya','Aisha','Kiara',
  'Navya','Avni','Ira','Kavya','Siya','Riya','Shanaya','Tanya','Trisha','Zara',
  'Aditi','Anushka','Bhavna','Chitra','Deepika','Ekta','Gauri','Harini','Ishita','Jaya',
  'Kavitha','Lakshmi','Meera','Nidhi','Pallavi','Rashmi','Sakshi','Tanvi','Vaishali','Neha',
  'Pooja','Shreya','Sneha','Swati','Divya','Komal','Mansi','Nikita','Payal','Radhika',
  'Sangeeta','Sunita','Vandana','Anjali','Jyoti','Kalpana','Madhuri','Namrata','Poonam','Rekha',
  'Shilpa','Tejaswini','Vidya','Khushi','Naina','Shalini','Archana','Charvi','Drishti','Simran',
  'Preeti','Kajal','Suman','Aarti','Megha','Ritika','Sanjana','Vibha','Yukti','Bhagyashree',
  'Chandni','Diksha','Esha','Geetika','Hema','Janvi','Mamta','Padma','Rachna','Tara',
  'Usha','Varsha','Yamuna','Amrita','Revathi','Shruti','Aanchal','Bhavika','Garima','Heena',
  'Manisha','Prerna','Rupal','Srishti','Vaidehi','Nandini','Aparna','Mithila','Sweta','Isha',
];

// ─── Indian last names ──────────────────────────────────────────

const indianLast = [
  'Sharma','Verma','Patel','Gupta','Singh','Kumar','Rao','Reddy','Iyer','Nair',
  'Joshi','Agarwal','Banerjee','Chatterjee','Mukherjee','Das','Ghosh','Sen','Bose','Roy',
  'Chopra','Kapoor','Malhotra','Khanna','Mehra','Sethi','Bhatia','Kohli','Arora','Dhawan',
  'Pillai','Menon','Krishnan','Venkatesh','Subramaniam','Srinivasan','Raman','Desai','Shah','Mehta',
  'Gandhi','Trivedi','Pandey','Mishra','Tiwari','Dubey','Jain','Goel','Khurana','Nagpal',
  'Sachdev','Sahni','Soni','Taneja','Vohra','Walia','Yadav','Chauhan','Thakur','Rawat',
  'Negi','Bisht','Kaushik','Saxena','Srivastava','Dwivedi','Hegde','Shetty','Kulkarni','Deshpande',
  'Patil','Shinde','Jadhav','More','Pawar','Sawant','Thakkar','Vyas','Modi','Parikh',
  'Dave','Bhatt','Raval','Solanki','Choudhary','Rajput','Rathore','Bhandari','Khatri','Ahuja',
  'Grover','Mittal','Singhal','Rastogi','Bajaj','Chawla','Dua','Luthra','Oberoi','Pahwa',
  'Naidu','Prasad','Rajan','Swaminathan','Goswami','Tripathi','Upadhyay','Chandra','Mani','Narayan',
];

// ─── International names ────────────────────────────────────────

const intlMale = [
  'James','Michael','Robert','David','William','John','Daniel','Matthew','Christopher','Andrew',
  'Alexander','Benjamin','Ethan','Jacob','Noah','Lucas','Oliver','Sebastian','Henry','Mohammed',
  'Ahmed','Omar','Ali','Hassan','Ibrahim','Wei','Chen','Jun','Ming','Hao',
  'Hiroshi','Takeshi','Yuki','Haruki','Daiki','Carlos','Miguel','Diego','Luis','Pablo',
  'Pierre','Jean','Louis','Thomas','Nicolas','Hans','Stefan','Martin','Felix','Lukas',
  'Dmitri','Alexei','Sergei','Ivan','Nikolai','Ryan','Kevin','Brian','Patrick','Liam',
  'Aiden','Dylan','Tyler','Connor','Sean','Marcus','Brandon','Nathan','Eric','Jason',
];

const intlFemale = [
  'Emma','Olivia','Ava','Sophia','Isabella','Mia','Charlotte','Amelia','Harper','Evelyn',
  'Sarah','Jessica','Emily','Rachel','Hannah','Michelle','Lauren','Ashley','Samantha','Jennifer',
  'Fatima','Aisha','Layla','Maryam','Nour','Mei','Ling','Yan','Jing','Yue',
  'Yuki','Sakura','Aiko','Emi','Haruka','Maria','Sofia','Valentina','Camila','Lucia',
  'Marie','Sophie','Camille','Chloe','Clara','Anna','Lena','Lisa','Julia','Nina',
  'Anastasia','Natasha','Olga','Irina','Elena','Grace','Lily','Ruby','Ella','Isla',
  'Caitlin','Siobhan','Aoife','Nicole','Amber','Kayla','Madison','Victoria','Stella','Aria',
];

const intlLast = [
  'Smith','Johnson','Williams','Brown','Jones','Miller','Davis','Garcia','Rodriguez','Wilson',
  'Martinez','Anderson','Taylor','Thomas','Hernandez','Moore','Martin','Jackson','Thompson','White',
  'Al-Hassan','Al-Rashid','Mansour','Nasser','Khalil','Chen','Wang','Li','Zhang','Liu',
  'Tanaka','Suzuki','Yamamoto','Watanabe','Nakamura','Santos','Ferreira','Costa','Oliveira','Silva',
  'Dubois','Moreau','Laurent','Simon','Bernard','Mueller','Schmidt','Fischer','Weber','Meyer',
  'Ivanov','Petrov','Smirnov','Kuznetsov','Popov','Murphy','Kelly','Sullivan','Walsh','Ryan',
  'OBrien','McCarthy','Collins','Doyle','Lee','Kim','Park','Choi','Kang','Yoon',
];

// ─── Email domains (weighted) ───────────────────────────────────

const emailDomains = ['gmail.com','gmail.com','gmail.com','gmail.com','gmail.com',
  'yahoo.com','yahoo.in','yahoo.co.in',
  'outlook.com','hotmail.com','live.com',
  'protonmail.com','icloud.com','rediffmail.com','zoho.com','mail.com','aol.com'];

// Indian-specific college / corporate domains for extra realism
const indianProDomains = [
  'gmail.com','gmail.com','gmail.com','outlook.com','hotmail.com',
  'yahoo.com','yahoo.in','rediffmail.com','protonmail.com','icloud.com',
];

// ─── Sources & UTMs ─────────────────────────────────────────────

const sourceWeights = [
  { source: 'website', w: 40 },
  { source: 'twitter', w: 18 },
  { source: 'discord', w: 10 },
  { source: 'telegram', w: 6 },
  { source: 'reddit', w: 5 },
  { source: 'google', w: 5 },
  { source: 'linkedin', w: 5 },
  { source: 'youtube', w: 4 },
  { source: 'referral', w: 7 },
];
function pickSource(): string {
  return weightedPick(sourceWeights.map(s => s.source), sourceWeights.map(s => s.w));
}

const utmCampaigns = [
  null,null,null,null,null,null,
  'launch_2025','early_access','waitlist_v2','crypto_twitter',
  'stellar_discord','web3_builders','defi_users','zk_curious',
  'scf_grant','devpost_hack','product_hunt','hacker_news',
];
const utmSources = [null,null,null,null,'twitter','discord','telegram','reddit','youtube','linkedin','newsletter','blog'];
const utmMediums = [null,null,null,'social','organic','referral','cpc','email','banner'];

// ─── Browsers, OS, devices ──────────────────────────────────────

const browserPool = ['Chrome','Chrome','Chrome','Chrome','Chrome','Safari','Safari','Firefox','Edge','Opera','Brave','Samsung Internet'];
const osPool = ['Windows','Windows','Windows','macOS','macOS','Android','Android','Android','iOS','iOS','Linux'];
const devicePool = ['mobile','mobile','mobile','mobile','desktop','desktop','desktop','tablet'];

// ─── Locations ──────────────────────────────────────────────────

const indianCities: { city: string; region: string }[] = [
  { city:'Mumbai', region:'Maharashtra' },{ city:'Delhi', region:'Delhi' },{ city:'Bangalore', region:'Karnataka' },
  { city:'Hyderabad', region:'Telangana' },{ city:'Chennai', region:'Tamil Nadu' },{ city:'Kolkata', region:'West Bengal' },
  { city:'Pune', region:'Maharashtra' },{ city:'Ahmedabad', region:'Gujarat' },{ city:'Jaipur', region:'Rajasthan' },
  { city:'Lucknow', region:'Uttar Pradesh' },{ city:'Surat', region:'Gujarat' },{ city:'Kanpur', region:'Uttar Pradesh' },
  { city:'Nagpur', region:'Maharashtra' },{ city:'Indore', region:'Madhya Pradesh' },{ city:'Thane', region:'Maharashtra' },
  { city:'Bhopal', region:'Madhya Pradesh' },{ city:'Visakhapatnam', region:'Andhra Pradesh' },{ city:'Patna', region:'Bihar' },
  { city:'Vadodara', region:'Gujarat' },{ city:'Ghaziabad', region:'Uttar Pradesh' },{ city:'Ludhiana', region:'Punjab' },
  { city:'Agra', region:'Uttar Pradesh' },{ city:'Nashik', region:'Maharashtra' },{ city:'Faridabad', region:'Haryana' },
  { city:'Meerut', region:'Uttar Pradesh' },{ city:'Rajkot', region:'Gujarat' },{ city:'Varanasi', region:'Uttar Pradesh' },
  { city:'Amritsar', region:'Punjab' },{ city:'Ranchi', region:'Jharkhand' },{ city:'Coimbatore', region:'Tamil Nadu' },
  { city:'Vijayawada', region:'Andhra Pradesh' },{ city:'Madurai', region:'Tamil Nadu' },{ city:'Raipur', region:'Chhattisgarh' },
  { city:'Chandigarh', region:'Punjab' },{ city:'Guwahati', region:'Assam' },{ city:'Mysore', region:'Karnataka' },
  { city:'Bhubaneswar', region:'Odisha' },{ city:'Noida', region:'Uttar Pradesh' },{ city:'Gurugram', region:'Haryana' },
  { city:'Kochi', region:'Kerala' },{ city:'Thiruvananthapuram', region:'Kerala' },{ city:'Mangalore', region:'Karnataka' },
  { city:'Dehradun', region:'Uttarakhand' },{ city:'Jamshedpur', region:'Jharkhand' },{ city:'Hubli', region:'Karnataka' },
  { city:'Jodhpur', region:'Rajasthan' },{ city:'Tiruchirappalli', region:'Tamil Nadu' },{ city:'Salem', region:'Tamil Nadu' },
  { city:'Warangal', region:'Telangana' },{ city:'Guntur', region:'Andhra Pradesh' },{ city:'Bikaner', region:'Rajasthan' },
  { city:'Udaipur', region:'Rajasthan' },{ city:'Jalandhar', region:'Punjab' },{ city:'Kota', region:'Rajasthan' },
  { city:'Navi Mumbai', region:'Maharashtra' },{ city:'Aurangabad', region:'Maharashtra' },{ city:'Shimla', region:'Himachal Pradesh' },
  { city:'Goa', region:'Goa' },{ city:'Pondicherry', region:'Tamil Nadu' },{ city:'Siliguri', region:'West Bengal' },
  { city:'Srinagar', region:'Jammu and Kashmir' },{ city:'Gorakhpur', region:'Uttar Pradesh' },
];

// Tier weighting — metro cities appear more often
const indianCityWeights = indianCities.map((c, i) => (i < 12 ? 8 : i < 24 ? 4 : i < 40 ? 2 : 1));

const intlLocations = [
  { country:'United States', cities:['New York','San Francisco','Los Angeles','Chicago','Austin','Seattle','Boston','Miami','Denver','Portland'], region:'US' },
  { country:'United Kingdom', cities:['London','Manchester','Birmingham','Bristol','Edinburgh'], region:'England' },
  { country:'Singapore', cities:['Singapore'], region:'Central' },
  { country:'United Arab Emirates', cities:['Dubai','Abu Dhabi'], region:'Dubai' },
  { country:'Canada', cities:['Toronto','Vancouver','Montreal','Ottawa'], region:'Ontario' },
  { country:'Australia', cities:['Sydney','Melbourne','Brisbane','Perth'], region:'NSW' },
  { country:'Germany', cities:['Berlin','Munich','Frankfurt','Hamburg'], region:'Bavaria' },
  { country:'Netherlands', cities:['Amsterdam','Rotterdam','Utrecht'], region:'North Holland' },
  { country:'Japan', cities:['Tokyo','Osaka','Kyoto'], region:'Kanto' },
  { country:'South Korea', cities:['Seoul','Busan'], region:'Seoul' },
  { country:'Nigeria', cities:['Lagos','Abuja'], region:'Lagos' },
  { country:'Kenya', cities:['Nairobi'], region:'Nairobi' },
  { country:'Brazil', cities:['Sao Paulo','Rio de Janeiro'], region:'SP' },
  { country:'Indonesia', cities:['Jakarta','Bali'], region:'Java' },
  { country:'Philippines', cities:['Manila','Cebu'], region:'NCR' },
  { country:'Vietnam', cities:['Ho Chi Minh City','Hanoi'], region:'HCMC' },
  { country:'France', cities:['Paris','Lyon','Marseille'], region:'Ile-de-France' },
  { country:'Israel', cities:['Tel Aviv','Jerusalem'], region:'Tel Aviv' },
  { country:'Estonia', cities:['Tallinn'], region:'Harju' },
  { country:'Switzerland', cities:['Zurich','Geneva'], region:'Zurich' },
];

const intlTimezones: Record<string, string> = {
  'United States':'America/New_York','United Kingdom':'Europe/London','Singapore':'Asia/Singapore',
  'United Arab Emirates':'Asia/Dubai','Canada':'America/Toronto','Australia':'Australia/Sydney',
  'Germany':'Europe/Berlin','Netherlands':'Europe/Amsterdam','Japan':'Asia/Tokyo',
  'South Korea':'Asia/Seoul','Nigeria':'Africa/Lagos','Kenya':'Africa/Nairobi',
  'Brazil':'America/Sao_Paulo','Indonesia':'Asia/Jakarta','Philippines':'Asia/Manila',
  'Vietnam':'Asia/Ho_Chi_Minh','France':'Europe/Paris','Israel':'Asia/Jerusalem',
  'Estonia':'Europe/Tallinn','Switzerland':'Europe/Zurich',
};

// ─── Generators ─────────────────────────────────────────────────

function indianName(): { first: string; last: string } {
  const isMale = Math.random() > 0.42;
  return { first: pick(isMale ? indianMale : indianFemale), last: pick(indianLast) };
}

function intlName(): { first: string; last: string } {
  const isMale = Math.random() > 0.45;
  return { first: pick(isMale ? intlMale : intlFemale), last: pick(intlLast) };
}

/** Generate a human-looking email from a name */
function makeEmail(first: string, last: string, isIndian: boolean): string {
  const domain = pick(isIndian ? indianProDomains : emailDomains);
  const f = first.toLowerCase().replace(/[^a-z]/g, '');
  const l = last.toLowerCase().replace(/[^a-z]/g, '');
  const yr = rand(88, 5); // last 2 digits of birth year
  const n = rand(1, 999);

  const patterns = [
    `${f}.${l}`,               // priya.sharma
    `${f}${l}`,                // priyasharma
    `${f}${n}`,                // priya472
    `${f}.${l}${rand(1,99)}`,  // priya.sharma42
    `${f[0]}${l}`,             // psharma
    `${f}_${l}`,               // priya_sharma
    `${l}.${f}`,               // sharma.priya
    `${f}${l.slice(0,3)}`,     // priyasha
    `${f}${yr}`,               // priya98
    `${f}.${l[0]}${rand(10,99)}`, // priya.s47
    `${f}${l}${rand(1,9)}`,   // priyasharma3
    `${l}${f[0]}${rand(1,99)}`,// sharmap21
    `${f}${l}${yr}`,          // priyasharma98
    `${f}.${rand(100,999)}`,   // priya.847
  ];
  const base = pick(patterns).replace(/[^a-z0-9._-]/g, '');
  return `${base}@${domain}`;
}

/** Realistic timestamp spread: most signups in last 45 days, exponential decay,
 *  with realistic hour-of-day distribution (peaks 10am-2pm IST, 7pm-11pm IST) */
function makeTimestamp(maxDaysAgo: number = 75): Date {
  // Power-law: more recent signups are more likely
  const daysAgo = Math.floor(Math.pow(Math.random(), 2.2) * maxDaysAgo);

  // Realistic hour distribution — double peak (morning + evening IST)
  let hour: number;
  const r = Math.random();
  if (r < 0.35)      hour = rand(10, 14);  // morning peak
  else if (r < 0.65) hour = rand(19, 23);  // evening peak
  else if (r < 0.85) hour = rand(14, 19);  // afternoon
  else                hour = rand(0, 9);    // late night / early morning

  const mins = rand(0, 59);
  const secs = rand(0, 59);

  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, mins, secs, rand(0, 999));
  return d;
}

function makeUserAgent(browser: string, os: string): string {
  const cv = rand(112, 131);
  const sv = rand(16, 18);
  const fv = rand(115, 130);
  if (browser === 'Chrome' && os === 'Windows')
    return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${cv}.0.0.0 Safari/537.36`;
  if (browser === 'Chrome' && os === 'macOS')
    return `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${cv}.0.0.0 Safari/537.36`;
  if (browser === 'Chrome' && os === 'Linux')
    return `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${cv}.0.0.0 Safari/537.36`;
  if (browser === 'Safari' && (os === 'macOS' || os === 'iOS'))
    return `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${sv}.${rand(0,4)} Safari/605.1.15`;
  if (browser === 'Chrome' && os === 'Android')
    return `Mozilla/5.0 (Linux; Android ${rand(12,15)}; SM-${pick(['G991B','A536B','S911B','A546B','A156B'])}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${cv}.0.${rand(5000,6500)}.${rand(50,200)} Mobile Safari/537.36`;
  if (browser === 'Samsung Internet' && os === 'Android')
    return `Mozilla/5.0 (Linux; Android ${rand(12,14)}; SM-${pick(['G991B','A536B','S911B'])}) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/${rand(20,25)}.0 Chrome/${cv}.0.0.0 Mobile Safari/537.36`;
  if (os === 'iOS')
    return `Mozilla/5.0 (iPhone; CPU iPhone OS ${rand(16,18)}_${rand(0,5)} like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${sv}.0 Mobile/15E148 Safari/604.1`;
  if (browser === 'Firefox')
    return `Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:${fv}.0) Gecko/20100101 Firefox/${fv}.0`;
  if (browser === 'Edge')
    return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${cv}.0.0.0 Safari/537.36 Edg/${cv}.0.0.0`;
  if (browser === 'Brave')
    return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${cv}.0.0.0 Safari/537.36`;
  if (browser === 'Opera')
    return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${cv}.0.0.0 Safari/537.36 OPR/${rand(95,110)}.0.0.0`;
  return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${cv}.0.0.0 Safari/537.36`;
}

function makeIP(): string {
  return `${rand(1,223)}.${rand(0,255)}.${rand(0,255)}.${rand(1,254)}`;
}

function makeReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'SR-';
  for (let i = 0; i < 6; i++) code += chars[rand(0, chars.length - 1)];
  return code;
}

/** Stellar-format public key (G + 55 uppercase base32 chars) */
function makeStellarAddress(): string {
  const b32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let addr = 'G';
  for (let i = 0; i < 55; i++) addr += b32[rand(0, b32.length - 1)];
  return addr;
}

/** Fake but realistic-looking Google subject ID (21-digit number) */
function makeGoogleSub(): string {
  return '1' + Array.from({ length: 20 }, () => rand(0, 9)).join('');
}

/** Fake Google profile picture URL */
function makeGooglePicture(): string {
  const id = crypto.randomBytes(16).toString('base64url');
  return `https://lh3.googleusercontent.com/a/ACg8oc${id}=s96-c`;
}

function locationFor(isIndian: boolean) {
  if (isIndian) {
    const loc = weightedPick(indianCities, indianCityWeights);
    return { country: 'India', city: loc.city, region: loc.region, timezone: 'Asia/Kolkata' };
  }
  const loc = pick(intlLocations);
  return { country: loc.country, city: pick(loc.cities), region: loc.region, timezone: intlTimezones[loc.country] || 'UTC' };
}

// ─── Waitlist entry generator ───────────────────────────────────

interface WaitlistRow {
  email: string; created_at: string; source: string; referrer: string | null;
  utm_source: string | null; utm_medium: string | null; utm_campaign: string | null;
  user_agent: string; ip_address: string; country: string; city: string; region: string;
  timezone: string; device_type: string; browser: string; os: string;
  email_verified: boolean; status: string; referral_code: string; referred_by: string | null;
}

const usedWaitlistEmails = new Set<string>();

function genWaitlistEntry(isIndian: boolean): WaitlistRow {
  const { first, last } = isIndian ? indianName() : intlName();
  let email: string;
  do { email = makeEmail(first, last, isIndian); } while (usedWaitlistEmails.has(email));
  usedWaitlistEmails.add(email);

  const browser = pick(browserPool);
  const os = pick(osPool);
  const loc = locationFor(isIndian);
  const source = pickSource();

  return {
    email,
    created_at: makeTimestamp(75).toISOString(),
    source,
    referrer: Math.random() > 0.6 ? `https://${pick(['twitter.com','discord.com','reddit.com','google.com','t.me','linkedin.com','youtube.com'])}/...` : null,
    utm_source: Math.random() > 0.5 ? pick(utmSources) : null,
    utm_medium: Math.random() > 0.5 ? pick(utmMediums) : null,
    utm_campaign: Math.random() > 0.55 ? pick(utmCampaigns) : null,
    user_agent: makeUserAgent(browser, os),
    ip_address: makeIP(),
    country: loc.country,
    city: loc.city,
    region: loc.region,
    timezone: loc.timezone,
    device_type: pick(devicePool),
    browser,
    os,
    email_verified: Math.random() > 0.10,
    status: Math.random() > 0.05 ? 'active' : 'pending',
    referral_code: makeReferralCode(),
    referred_by: Math.random() > 0.82 ? makeReferralCode() : null,
  };
}

// ─── Authenticated user generator ───────────────────────────────

interface AuthUserRow {
  google_sub: string; google_email: string; google_name: string; google_picture: string;
  wallet_address: string; network: string;
  first_login_at: string; last_login_at: string; login_count: number;
  user_agent: string; country: string; device_type: string;
}

const usedAuthEmails = new Set<string>();
const usedSubs = new Set<string>();

function genAuthUser(isIndian: boolean): AuthUserRow {
  const { first, last } = isIndian ? indianName() : intlName();
  let email: string;
  do { email = makeEmail(first, last, isIndian); } while (usedAuthEmails.has(email));
  usedAuthEmails.add(email);

  let sub: string;
  do { sub = makeGoogleSub(); } while (usedSubs.has(sub));
  usedSubs.add(sub);

  const firstLogin = makeTimestamp(60);
  // Realistic login count distribution: most users 1-3, power users up to 40
  let loginCount: number;
  const r = Math.random();
  if (r < 0.40)      loginCount = 1;
  else if (r < 0.65) loginCount = rand(2, 3);
  else if (r < 0.80) loginCount = rand(4, 8);
  else if (r < 0.92) loginCount = rand(9, 18);
  else                loginCount = rand(19, 45);

  // Last login: between first login and now, biased toward recent
  const msSinceFirst = Date.now() - firstLogin.getTime();
  const lastLoginOffset = Math.floor(Math.pow(Math.random(), 0.5) * msSinceFirst); // biased recent
  const lastLogin = loginCount === 1 ? firstLogin : new Date(firstLogin.getTime() + lastLoginOffset);

  const browser = pick(browserPool);
  const os = pick(osPool);
  const loc = locationFor(isIndian);

  const fullName = `${first} ${last}`;

  return {
    google_sub: sub,
    google_email: email,
    google_name: fullName,
    google_picture: makeGooglePicture(),
    wallet_address: makeStellarAddress(),
    network: 'testnet',
    first_login_at: firstLogin.toISOString(),
    last_login_at: lastLogin.toISOString(),
    login_count: loginCount,
    user_agent: makeUserAgent(browser, os),
    country: loc.country,
    device_type: pick(devicePool),
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  MAIN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function main() {
  console.log('\n  StellaRay Comprehensive Seed\n');
  console.log('='.repeat(55));

  // ── 1. Waitlist ────────────────────────────────────────────

  const WL_TARGET = 3100;
  const WL_INDIAN = Math.floor(WL_TARGET * 0.80);
  const WL_INTL   = WL_TARGET - WL_INDIAN;

  console.log(`\n  [Waitlist] Generating ${WL_TARGET} entries (${WL_INDIAN} IN / ${WL_INTL} intl)...`);

  const wlEntries: WaitlistRow[] = [];
  for (let i = 0; i < WL_INDIAN; i++) wlEntries.push(genWaitlistEntry(true));
  for (let i = 0; i < WL_INTL; i++)  wlEntries.push(genWaitlistEntry(false));

  // Shuffle then sort by timestamp for natural ordering
  for (let i = wlEntries.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [wlEntries[i], wlEntries[j]] = [wlEntries[j], wlEntries[i]];
  }
  wlEntries.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  console.log('  [Waitlist] Inserting into database...');

  let wlInserted = 0, wlDupes = 0, wlErrors = 0;

  for (let i = 0; i < wlEntries.length; i += 50) {
    const batch = wlEntries.slice(i, i + 50);
    for (const e of batch) {
      try {
        await sql`
          INSERT INTO waitlist (
            email, created_at, source, referrer,
            utm_source, utm_medium, utm_campaign,
            user_agent, ip_address, country, city, region, timezone,
            device_type, browser, os,
            email_verified, status, referral_code, referred_by
          ) VALUES (
            ${e.email}, ${e.created_at}, ${e.source}, ${e.referrer},
            ${e.utm_source}, ${e.utm_medium}, ${e.utm_campaign},
            ${e.user_agent}, ${e.ip_address}, ${e.country}, ${e.city}, ${e.region}, ${e.timezone},
            ${e.device_type}, ${e.browser}, ${e.os},
            ${e.email_verified}, ${e.status}, ${e.referral_code}, ${e.referred_by}
          )
          ON CONFLICT (email) DO NOTHING
        `;
        wlInserted++;
      } catch (err: any) {
        if (err.message?.includes('duplicate') || err.message?.includes('unique')) wlDupes++;
        else { wlErrors++; if (wlErrors <= 3) console.error(`    err: ${err.message?.slice(0, 100)}`); }
      }
    }
    const pct = Math.min(100, Math.round(((i + 50) / wlEntries.length) * 100));
    process.stdout.write(`\r  [Waitlist] ${pct}%  (${wlInserted} inserted)`);
  }
  console.log(`\n  [Waitlist] Done: ${wlInserted} inserted, ${wlDupes} dupes, ${wlErrors} errors`);

  // ── 2. Authenticated Users ─────────────────────────────────

  const AU_TARGET = 2000;
  const AU_INDIAN = Math.floor(AU_TARGET * 0.80);
  const AU_INTL   = AU_TARGET - AU_INDIAN;

  console.log(`\n  [Auth Users] Generating ${AU_TARGET} entries (${AU_INDIAN} IN / ${AU_INTL} intl)...`);

  const auEntries: AuthUserRow[] = [];
  for (let i = 0; i < AU_INDIAN; i++) auEntries.push(genAuthUser(true));
  for (let i = 0; i < AU_INTL; i++)  auEntries.push(genAuthUser(false));

  // Shuffle then sort
  for (let i = auEntries.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [auEntries[i], auEntries[j]] = [auEntries[j], auEntries[i]];
  }
  auEntries.sort((a, b) => new Date(a.first_login_at).getTime() - new Date(b.first_login_at).getTime());

  console.log('  [Auth Users] Inserting into database...');

  let auInserted = 0, auDupes = 0, auErrors = 0;

  for (let i = 0; i < auEntries.length; i += 50) {
    const batch = auEntries.slice(i, i + 50);
    for (const e of batch) {
      try {
        await sql`
          INSERT INTO authenticated_users (
            google_sub, google_email, google_name, google_picture,
            wallet_address, network,
            first_login_at, last_login_at, login_count,
            user_agent, country, device_type
          ) VALUES (
            ${e.google_sub}, ${e.google_email}, ${e.google_name}, ${e.google_picture},
            ${e.wallet_address}, ${e.network},
            ${e.first_login_at}, ${e.last_login_at}, ${e.login_count},
            ${e.user_agent}, ${e.country}, ${e.device_type}
          )
          ON CONFLICT (google_sub) DO NOTHING
        `;
        auInserted++;
      } catch (err: any) {
        if (err.message?.includes('duplicate') || err.message?.includes('unique')) auDupes++;
        else { auErrors++; if (auErrors <= 3) console.error(`    err: ${err.message?.slice(0, 100)}`); }
      }
    }
    const pct = Math.min(100, Math.round(((i + 50) / auEntries.length) * 100));
    process.stdout.write(`\r  [Auth Users] ${pct}%  (${auInserted} inserted)`);
  }
  console.log(`\n  [Auth Users] Done: ${auInserted} inserted, ${auDupes} dupes, ${auErrors} errors`);

  // ── 3. Final stats ─────────────────────────────────────────

  console.log('\n' + '='.repeat(55));
  console.log('  Final Database Counts:\n');

  try {
    const [wl, au, wlCountry, auCountry] = await Promise.all([
      sql`SELECT COUNT(*) as c, COUNT(*) FILTER (WHERE country='India') as india FROM waitlist`,
      sql`SELECT COUNT(*) as c, COUNT(*) FILTER (WHERE country='India') as india, ROUND(AVG(login_count),1) as avg_logins FROM authenticated_users`,
      sql`SELECT country, COUNT(*) as n FROM waitlist GROUP BY country ORDER BY n DESC LIMIT 5`,
      sql`SELECT country, COUNT(*) as n FROM authenticated_users GROUP BY country ORDER BY n DESC LIMIT 5`,
    ]);

    console.log(`  Waitlist:           ${wl[0].c} total  (${wl[0].india} India)`);
    console.log(`  Authenticated:      ${au[0].c} total  (${au[0].india} India, avg ${au[0].avg_logins} logins)`);

    console.log('\n  Top waitlist countries:');
    wlCountry.forEach((r: any, i: number) => console.log(`    ${i+1}. ${r.country}: ${r.n}`));

    console.log('\n  Top auth user countries:');
    auCountry.forEach((r: any, i: number) => console.log(`    ${i+1}. ${r.country}: ${r.n}`));
  } catch {
    console.log('  (could not fetch final stats)');
  }

  console.log('\n' + '='.repeat(55));
  console.log('  All done!\n');
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error('Fatal:', e); process.exit(1); });
