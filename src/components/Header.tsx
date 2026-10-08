import * as React from "react";
import { Sun, Moon, ChevronDown, LogOut } from "lucide-react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { AppPage, getPagePath } from "../seo/routeMeta";
import { useTheme } from "../hooks/useTheme";
import { useLang } from "../i18n/LangContext";

/** Solana 3-bar mark (official gradient). */
const SolanaMark: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 20 16" className={className} aria-hidden>
    <defs>
      <linearGradient id="sol-grad" x1="0" y1="0" x2="20" y2="16" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#14F195" />
        <stop offset="100%" stopColor="#9945FF" />
      </linearGradient>
    </defs>
    <g fill="url(#sol-grad)">
      <path d="M3.9 0.4h12.7l-2.1 2.1H1.8L3.9 0.4zM3.9 6.9h12.7l-2.1 2.1H1.8L3.9 6.9zM3.9 13.5h12.7l-2.1 2.1H1.8l2.1-2.1z" />
    </g>
  </svg>
);

interface HeaderProps {
  currentPage: AppPage;
  onPageChange: (page: AppPage) => void;
  theme?: "dark" | "light";
  onToggleTheme?: () => void;
}

const navItems: { id: AppPage; labelKey: string }[] = [
  { id: "spot", labelKey: "nav.spot" },
  { id: "perps", labelKey: "nav.perps" },
  // Options entry hidden for the hackathon demo (boss: v1 ships without
  // options — the route/page still exists, just not in the nav).
  // Launch entry hidden (boss 2026-10-08: meme launch paused, focus on the
  // core protocol; the /launch route/page still exists).
  { id: "pools", labelKey: "nav.pools" },
  { id: "referral", labelKey: "nav.referral" },
];

/** Reference design (CatSwapService/packages/frontend Header) wired to
 * wallet-adapter: the LOOK is a byte-level port of the reference wallet
 * section (balance chip + address dropdown + disconnect / flat connect
 * button), the SIGNING goes through the real multi-wallet adapter. */
export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onPageChange,
}) => {
  const { isDark, toggleTheme } = useTheme();
  const { lang, toggleLang, t } = useLang();
  const { connection } = useConnection();
  const { publicKey, connected, disconnect } = useWallet();
  const { setVisible } = useWalletModal();

  const [showDropdown, setShowDropdown] = React.useState(false);
  const [balanceSol, setBalanceSol] = React.useState<number | null>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  // Balance chip (reference shows BTC balance; Solana port shows SOL).
  React.useEffect(() => {
    let cancelled = false;
    if (!connected || !publicKey) {
      setBalanceSol(null);
      return;
    }
    const load = async () => {
      try {
        const lamports = await connection.getBalance(publicKey);
        if (!cancelled) setBalanceSol(lamports / 1e9);
      } catch {
        if (!cancelled) setBalanceSol(null);
      }
    };
    load();
    const id = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [connection, connected, publicKey]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle keyboard navigation
  React.useEffect(() => {
    if (!showDropdown) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setShowDropdown(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showDropdown]);

  const handleDisconnect = () => {
    disconnect();
    setShowDropdown(false);
  };

  const address = publicKey?.toBase58() ?? "";
  const isHome = currentPage === "home";
  // boss 9/19：homepage 默认暗黑、无主题切换——landing 页 header 恒深色并隐藏 toggle
  const theme = isHome || isDark ? "dark" : "light";

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        isHome
          ? "bg-[#0B0E11] border-b border-white/10"
          : "bg-[var(--bg-secondary)] border-b border-[var(--border-primary)]"
      }`}>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-10 sm:h-11 flex items-center justify-between">
            {/* Logo & Brand */}
            <div className="flex items-center gap-8">
              <a
                href={getPagePath("home")}
                className="flex items-center cursor-pointer group"
                onClick={(event) => {
                  event.preventDefault();
                  if (currentPage === "home") return;
                  onPageChange("home");
                }}
              >
                {/* Logo - 根据主题切换（homepage 恒定深色） */}
                <img
                  src={currentPage === "home" || theme === "dark" ? "/logo_dark.svg" : "/logo_light.svg"}
                  alt="CatSwap"
                  className="h-[26px] w-auto"
                />
              </a>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => (
                  <a
                    key={item.id}
                    href={getPagePath(item.id)}
                    onClick={(event) => {
                      event.preventDefault();
                      if (currentPage === item.id) return;
                      onPageChange(item.id);
                    }}
                    className={`relative px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                      currentPage === item.id
                        ? "text-[var(--text-primary)]"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {t(item.labelKey)}
                    {currentPage === item.id && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[var(--text-primary)] rounded-full" />
                    )}
                  </a>
                ))}
              </nav>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Language Toggle（中 / EN，当前语言高亮） */}
              <button
                onClick={toggleLang}
                className="px-2 py-1.5 rounded-md text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-all duration-200"
                aria-label="Switch language / 切换语言"
              >
                <span className={lang === "zh" ? "text-[var(--text-primary)]" : ""}>中</span>
                <span className="mx-0.5 text-[var(--text-tertiary)]">/</span>
                <span className={lang === "en" ? "text-[var(--text-primary)]" : ""}>EN</span>
              </button>

              {/* Theme Toggle（homepage 恒定深色，不提供切换） */}
              {currentPage !== "home" && (
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all duration-200"
                  aria-label={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                  {theme === "dark" ? (
                    <Sun className="w-4 h-4" />
                  ) : (
                    <Moon className="w-4 h-4" />
                  )}
                </button>
              )}

              {/* Wallet Section (reference look, wallet-adapter wiring) */}
              {connected && publicKey ? (
                <div className="flex items-center gap-2">
                  {/* Balance Display */}
                  {balanceSol !== null && (
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {balanceSol.toFixed(4)}
                      </span>
                      <span className="text-xs text-[var(--text-secondary)]">SOL</span>
                    </div>
                  )}

                  {/* Wallet Dropdown */}
                  <div className="relative">
                    <button
                      ref={buttonRef}
                      onClick={() => setShowDropdown(!showDropdown)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--bg-tertiary)] hover:bg-[var(--bg-quaternary)] border border-[var(--border-primary)] transition-all duration-200"
                    >
                      <div className="w-5 h-5 rounded-full bg-[var(--bg-quaternary)] flex items-center justify-center">
                        <SolanaMark className="w-3 h-3 text-[var(--text-secondary)]" />
                      </div>
                      <span className="text-sm text-[var(--text-primary)]">
                        {address.slice(0, 4)}...{address.slice(-4)}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-[var(--text-tertiary)] transition-transform duration-200 ${
                          showDropdown ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {/* Dropdown Menu */}
                    {showDropdown && (
                      <div
                        ref={dropdownRef}
                        className="absolute top-full right-0 mt-2 py-1 min-w-[180px] rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] shadow-lg z-50"
                      >
                        {/* Mobile Balance */}
                        {balanceSol !== null && (
                          <div className="sm:hidden px-4 py-2 border-b border-[var(--border-primary)]">
                            <span className="text-xs text-[var(--text-secondary)]">Balance</span>
                            <div className="text-sm font-medium text-[var(--text-primary)]">
                              {balanceSol.toFixed(4)} SOL
                            </div>
                          </div>
                        )}

                        <button
                          onClick={handleDisconnect}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[var(--color-sell)] hover:bg-[var(--bg-tertiary)] transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Disconnect
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setVisible(true)}
                  className="px-4 py-1.5 rounded-md bg-[var(--text-primary)] text-[var(--bg-secondary)] text-sm font-medium hover:opacity-90 transition-all duration-200"
                >
                  <span className="hidden sm:inline">Connect Wallet</span>
                  <span className="sm:hidden">Connect</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-[var(--border-primary)] bg-[var(--bg-secondary)] pb-safe">
        {navItems.map((item) => (
          <a
            key={item.id}
            href={getPagePath(item.id)}
            onClick={(event) => {
              event.preventDefault();
              if (currentPage === item.id) return;
              onPageChange(item.id);
            }}
            className={`flex-1 py-3 text-xs font-medium transition-all duration-200 ${
              currentPage === item.id
                ? "text-[var(--text-primary)]"
                : "text-[var(--text-secondary)]"
            }`}
          >
            {t(item.labelKey)}
          </a>
        ))}
      </nav>
    </>
  );
};
