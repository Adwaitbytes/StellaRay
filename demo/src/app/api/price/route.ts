import { NextResponse } from 'next/server';

// Cache the price for 30 seconds to avoid rate limiting
let cachedPrice: { price: number; change24h: number; timestamp: number } | null = null;
const CACHE_DURATION = 30000; // 30 seconds

export async function GET() {
  // Return cached price if valid
  if (cachedPrice && Date.now() - cachedPrice.timestamp < CACHE_DURATION) {
    return NextResponse.json({
      price: cachedPrice.price,
      change24h: cachedPrice.change24h,
      cached: true,
    });
  }

  const apis = [
    {
      url: 'https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd&include_24hr_change=true',
      parse: (data: any) => ({
        price: data.stellar?.usd,
        change: data.stellar?.usd_24h_change || 0,
      }),
    },
    {
      url: 'https://api.coinpaprika.com/v1/tickers/xlm-stellar?quotes=USD',
      parse: (data: any) => ({
        price: data.quotes?.USD?.price,
        change: data.quotes?.USD?.percent_change_24h || 0,
      }),
    },
    {
      url: 'https://api.coincap.io/v2/assets/stellar',
      parse: (data: any) => ({
        price: parseFloat(data.data?.priceUsd),
        change: parseFloat(data.data?.changePercent24Hr) || 0,
      }),
    },
  ];

  for (const api of apis) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(api.url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'StellarGateway/1.0',
        },
      });
      clearTimeout(timeoutId);

      if (!res.ok) continue;

      const data = await res.json();
      const parsed = api.parse(data);

      if (parsed.price && typeof parsed.price === 'number' && !isNaN(parsed.price)) {
        cachedPrice = {
          price: parsed.price,
          change24h: parsed.change,
          timestamp: Date.now(),
        };

        return NextResponse.json({
          price: parsed.price,
          change24h: parsed.change,
          cached: false,
        });
      }
    } catch (err) {
      console.warn(`Price API failed (${api.url}):`, err);
      continue;
    }
  }

  // Return fallback if all APIs fail
  return NextResponse.json({
    price: 0.12,
    change24h: 0,
    fallback: true,
  });
}
