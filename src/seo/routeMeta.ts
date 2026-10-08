export type AppPage = 'home' | 'spot' | 'perps' | 'options' | 'pools' | 'referral' | 'launch';

export interface RouteMeta {
  description: string;
  heading: string;
  path: string;
  title: string;
}

export const SITE_NAME = 'CatSwap';
export const SITE_DESCRIPTION = 'CatSwap is a fair launchpad and unified trading protocol on Solana — one pool serving spot, margin, and perpetuals, built for stock tokens.';
export const DEFAULT_OG_IMAGE = '/logo_light.svg';
export const SITE_URL = (import.meta.env.VITE_SITE_URL ?? '').replace(/\/$/, '');

export const APP_ROUTES: Record<AppPage, RouteMeta> = {
  home: {
    path: '/',
    title: 'CatSwap | 为股票代币而生的统一交易协议',
    heading: 'Home',
    description: 'CatSwap 统一交易协议：同一份池流动性服务现货、杠杆与永续，内生定价、防御即收益。',
  },
  spot: {
    path: '/trade',
    title: 'CatSwap Spot Trading | Solana Unified Liquidity',
    heading: 'Spot Trading',
    description: 'Trade spot markets on CatSwap with fast execution, live charts, and unified on-chain liquidity on Solana.',
  },
  options: {
    path: '/options',
    title: 'CatSwap Options | Solana Unified Liquidity',
    heading: 'Options',
    description: 'Trade European cash-settled options on CatSwap — pool-writer quotes, frozen-EMA settlement, permissionless expiry settlement.',
  },
  perps: {
    path: '/perps',
    title: 'CatSwap Perpetuals | Solana Unified Liquidity',
    heading: 'Perpetual Futures',
    description: 'Open and manage perpetual positions on CatSwap with live funding data, responsive charting, and pool-native pricing on Solana.',
  },
  pools: {
    path: '/pools',
    title: 'CatSwap Liquidity Pools | Solana Unified Liquidity',
    heading: 'Liquidity Pools',
    description: 'Explore liquidity pools, review TVL and APR, and manage LP positions on CatSwap across Solana markets.',
  },
  referral: {
    path: '/referral',
    title: 'CatSwap Referral Program | Solana',
    heading: 'Referral Program',
    description: 'Bind a referrer, earn commission from trading fees, and claim your referral earnings on CatSwap.',
  },
  launch: {
    path: '/launch',
    title: 'CatSwap Launch | 无许可 Meme 发射',
    heading: 'Launch',
    description: 'Permissionless meme launch on CatSwap: unified launch price, full-supply seeding, genesis LP permanently locked, trading opens after the protection window.',
  },
};

export const DEFAULT_PAGE: AppPage = 'home';

export const getPagePath = (page: AppPage) => APP_ROUTES[page].path;

export const getPageKeyFromPath = (pathname: string): AppPage => {
  if (pathname.startsWith(APP_ROUTES.options.path)) return 'options';
  if (pathname.startsWith(APP_ROUTES.perps.path)) return 'perps';
  if (pathname.startsWith(APP_ROUTES.pools.path)) return 'pools';
  if (pathname.startsWith(APP_ROUTES.referral.path)) return 'referral';
  if (pathname.startsWith(APP_ROUTES.launch.path)) return 'launch';
  if (pathname.startsWith(APP_ROUTES.spot.path)) return 'spot';
  return DEFAULT_PAGE;
};

export const getRouteMetaForPath = (pathname: string): RouteMeta => {
  const normalizedPath = pathname.split('?')[0] || '/';
  return APP_ROUTES[getPageKeyFromPath(normalizedPath)];
};

export const buildPageUrl = (path: string, origin?: string) => {
  const normalizedOrigin = (origin ?? SITE_URL).replace(/\/$/, '');
  if (!normalizedOrigin) return path;
  return `${normalizedOrigin}${path}`;
};

export const createJsonLd = (meta: RouteMeta) => ({
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  applicationCategory: 'FinanceApplication',
  description: meta.description,
  name: `${SITE_NAME} ${meta.heading}`,
  operatingSystem: 'Web',
  url: buildPageUrl(meta.path),
});
