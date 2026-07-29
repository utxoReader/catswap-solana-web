import { Navigate, Outlet, Route, Routes, useLocation, useNavigate, useOutletContext, useSearchParams } from "react-router-dom";
import { Header } from "./components/Header";
import { SpotTradingPage } from "./components/SpotTradingPage";
import { PerpsTradingPage } from "./components/PerpsTradingPage";
import { PoolsPage } from "./components/PoolsPage";
import { ReferralPage } from "./components/ReferralPage";
import { DepositWithdraw } from "./components/DepositWithdraw";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useWallet } from "@solana/wallet-adapter-react";
import { usePageMeta } from "./hooks/usePageMeta";
import { AppPage, getPageKeyFromPath, getPagePath } from "./seo/routeMeta";

interface AppLayoutContext {
  connected: boolean;
  publicKey: string | null;
  connectWallet: () => void;
  navigateToTrade: (pair: string, type: "spot" | "perp") => void;
  selectedPair?: string;
}

const createTradeSearch = (pair?: string) => {
  if (!pair) return "";
  return `?pair=${encodeURIComponent(pair)}`;
};

const AppLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentPage = getPageKeyFromPath(location.pathname);
  const selectedPair = searchParams.get("pair") ?? undefined;
  const { connected, publicKey } = useWallet();

  const handleNavigateToTrade = (pair: string, type: "spot" | "perp") => {
    const pathname = type === "spot" ? getPagePath("spot") : getPagePath("perps");
    navigate(`${pathname}${createTradeSearch(pair)}`);
  };

  const handlePageChange = (page: AppPage) => {
    const nextPath = getPagePath(page);
    const nextSearch = page === "pools" ? "" : createTradeSearch(selectedPair);
    navigate(`${nextPath}${nextSearch}`);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Header
        currentPage={currentPage}
        onPageChange={handlePageChange}
      />
      <main className="pt-[45px] sm:pt-[52px] pb-20 md:pb-0 min-h-screen">
        <ErrorBoundary>
        <Outlet
          context={{
            connected,
            publicKey: publicKey?.toString() ?? null,
            connectWallet: () => {},
            navigateToTrade: handleNavigateToTrade,
            selectedPair,
          }}
        />
        </ErrorBoundary>
      </main>
    </div>
  );
};

const useAppLayoutContext = () => useOutletContext<AppLayoutContext>();

const SpotRoute = () => {
  const { connected, publicKey, selectedPair, connectWallet } = useAppLayoutContext();
  usePageMeta("spot");
  return (
    <SpotTradingPage
      connected={connected}
      publicKey={publicKey}
      selectedPair={selectedPair}
      connectWallet={connectWallet}
    />
  );
};

const PerpsRoute = () => {
  const { connected, publicKey, selectedPair, connectWallet } = useAppLayoutContext();
  usePageMeta("perps");
  return (
    <PerpsTradingPage
      connected={connected}
      publicKey={publicKey}
      selectedPair={selectedPair}
      connectWallet={connectWallet}
    />
  );
};

const PoolsRoute = () => {
  const { connected, navigateToTrade } = useAppLayoutContext();
  usePageMeta("pools");
  return (
    <PoolsPage
      connected={connected}
      onNavigateToTrade={navigateToTrade}
    />
  );
};

const ReferralRoute = () => {
  const { connected } = useAppLayoutContext();
  usePageMeta("referral");
  return <ReferralPage connected={connected} />;
};

const PortfolioRoute = () => {
  const { connected } = useAppLayoutContext();
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <DepositWithdraw connected={connected} />
    </div>
  );
};

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<SpotRoute />} />
        <Route path="perps" element={<PerpsRoute />} />
        <Route path="pools" element={<PoolsRoute />} />
        <Route path="referral" element={<ReferralRoute />} />
        <Route path="portfolio" element={<PortfolioRoute />} />
        <Route path="session" element={<Navigate replace to="/" />} />
        <Route path="*" element={<Navigate replace to="/" />} />
      </Route>
    </Routes>
  );
}

export default App;
