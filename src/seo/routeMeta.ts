export type AppPage = 'spot' | 'perps' | 'pools' | 'referral';

export interface RouteMeta {
  description: string;
  heading: string;
  path: string;
  title: string;
}

export const SITE_NAME = 'CatSwap';
export const SITE_DESCRIPTION = 'CatSwap is a Bitcoin L2 DEX for spot trading, perpetuals, and liquidity pools.';
export const DEFAULT_OG_IMAGE = '/logo_light.svg';
export const SITE_URL = (import.meta.env.VITE_SITE_URL ?? '').replace(/\/$/, '');

export const APP_ROUTES: Record<AppPage, RouteMeta> = {
  spot: {
    path: '/',
    title: 'CatSwap Spot Trading | Bitcoin L2 DEX',
    heading: 'Spot Trading',
    description: 'Trade spot markets on CatSwap with fast execution, live charts, and a Bitcoin L2 native trading experience.',
  },
  perps: {
    path: '/perps',
    title: 'CatSwap Perpetuals | Bitcoin L2 DEX',
    heading: 'Perpetual Futures',
    description: 'Open and manage perpetual positions on CatSwap with live funding data, responsive charting, and a Bitcoin L2 focused interface.',
  },
  pools: {
    path: '/pools',
    title: 'CatSwap Liquidity Pools | Bitcoin L2 DEX',
    heading: 'Liquidity Pools',
    description: 'Explore liquidity pools, review TVL and APR, and manage LP positions on CatSwap across Bitcoin L2 markets.',
  },
  referral: {
    path: '/referral',
    title: 'CatSwap Referral Program | Bitcoin L2 DEX',
    heading: 'Referral Program',
    description: 'Bind a referrer, earn commission from trading fees, and claim your referral earnings on CatSwap.',
  },
};

export const DEFAULT_PAGE: AppPage = 'spot';

export const getPagePath = (page: AppPage) => APP_ROUTES[page].path;

export const getPageKeyFromPath = (pathname: string): AppPage => {
  if (pathname.startsWith(APP_ROUTES.perps.path)) return 'perps';
  if (pathname.startsWith(APP_ROUTES.pools.path)) return 'pools';
  if (pathname.startsWith(APP_ROUTES.referral.path)) return 'referral';
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
