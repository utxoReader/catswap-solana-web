import { TradingPair, CandleData } from '../types';

export const tradingPairs: TradingPair[] = [
  {
    id: 'btc-usdt',
    symbol: 'BTC/USDT',
    name: 'Bitcoin',
    price: 98542.36,
    change24h: 2.34,
    volume24h: 28546234567,
    high24h: 99123.45,
    low24h: 96234.12,
  },
  {
    id: 'eth-usdt',
    symbol: 'ETH/USDT',
    name: 'Ethereum',
    price: 3456.78,
    change24h: -1.23,
    volume24h: 15234234567,
    high24h: 3521.45,
    low24h: 3389.12,
  },
  {
    id: 'sol-usdt',
    symbol: 'SOL/USDT',
    name: 'Solana',
    price: 187.45,
    change24h: 5.67,
    volume24h: 3423456789,
    high24h: 192.34,
    low24h: 175.23,
  },
  {
    id: 'bnb-usdt',
    symbol: 'BNB/USDT',
    name: 'BNB',
    price: 654.32,
    change24h: 0.89,
    volume24h: 1234567890,
    high24h: 665.45,
    low24h: 645.12,
  },
  {
    id: 'xrp-usdt',
    symbol: 'XRP/USDT',
    name: 'XRP',
    price: 2.45,
    change24h: -3.21,
    volume24h: 2345678901,
    high24h: 2.56,
    low24h: 2.38,
  },
  {
    id: 'doge-usdt',
    symbol: 'DOGE/USDT',
    name: 'Dogecoin',
    price: 0.3823,
    change24h: 8.45,
    volume24h: 987654321,
    high24h: 0.3956,
    low24h: 0.3512,
  },
  {
    id: 'ada-usdt',
    symbol: 'ADA/USDT',
    name: 'Cardano',
    price: 0.7823,
    change24h: 1.23,
    volume24h: 567890123,
    high24h: 0.7956,
    low24h: 0.7612,
  },
  {
    id: 'avax-usdt',
    symbol: 'AVAX/USDT',
    name: 'Avalanche',
    price: 42.56,
    change24h: -2.45,
    volume24h: 456789012,
    high24h: 44.23,
    low24h: 41.89,
  },
];

// Generate mock candlestick data
export const generateCandleData = (basePrice: number): CandleData[] => {
  const data: CandleData[] = [];
  let currentPrice = basePrice;
  const now = Date.now();

  for (let i = 100; i >= 0; i--) {
    const volatility = currentPrice * 0.02;
    const open = currentPrice;
    const close = open + (Math.random() - 0.5) * volatility;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    const volume = Math.random() * 1000000 + 500000;

    data.push({
      time: now - i * 3600000, // 1 hour candles
      open,
      high,
      low,
      close,
      volume,
    });

    currentPrice = close;
  }

  return data;
};
