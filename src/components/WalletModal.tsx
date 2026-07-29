import * as React from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectPhantom: () => void;
  onConnectMetaMask: () => void;
  onConnectCatena: () => void;
  isConnecting: boolean;
}

interface WalletOptionProps {
  name: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  isLoading: boolean;
  gradient?: string;
}

const WalletOption: React.FC<WalletOptionProps> = ({
  name,
  description,
  icon,
  onClick,
  isLoading,
  gradient = 'from-gray-500 to-gray-600',
}) => (
  <Button
    variant="ghost"
    onClick={onClick}
    disabled={isLoading}
    className="w-full flex items-center gap-4 p-4 h-auto justify-start border border-border bg-background-tertiary hover:border-success"
  >
    <div
      className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${gradient} shrink-0`}
    >
      {icon}
    </div>
    <div className="flex-1 text-left">
      <span className="block text-base font-medium text-foreground">
        {name}
      </span>
      <span className="text-xs text-foreground-tertiary">{description}</span>
    </div>
    {isLoading && (
      <div className="w-5 h-5 border-2 border-foreground-tertiary border-t-success rounded-full animate-spin" />
    )}
  </Button>
);

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  onConnectPhantom,
  onConnectMetaMask,
  onConnectCatena,
  isConnecting,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Connect Wallet"
      description="Connect your wallet to start trading"
      size="md"
    >
      <div className="space-y-3">
        {/* Catena Wallet */}
        <WalletOption
          name="Catena"
          description="Bitcoin Native"
          gradient="from-amber-500 to-amber-600"
          icon={
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none">
              <path
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
          onClick={onConnectCatena}
          isLoading={isConnecting}
        />

        {/* Phantom */}
        <WalletOption
          name="Phantom"
          description="Solana"
          gradient="from-purple-400 to-green-400"
          icon={
            <svg viewBox="0 0 128 128" width="28" height="28">
              <defs>
                <linearGradient
                  id="phantom-gradient"
                  x1="0%"
                  y1="50%"
                  x2="100%"
                  y2="50%"
                >
                  <stop offset="0%" stopColor="#AB9FF2" />
                  <stop offset="100%" stopColor="#14F195" />
                </linearGradient>
              </defs>
              <path
                fill="url(#phantom-gradient)"
                d="M64 0C28.7 0 0 28.7 0 64s28.7 64 64 64 64-28.7 64-64S99.3 0 64 0zm0 112c-26.5 0-48-21.5-48-48S37.5 16 64 16s48 21.5 48 48-21.5 48-48 48z"
              />
              <path
                fill="url(#phantom-gradient)"
                d="M92 58H36c-3.3 0-6 2.7-6 6s2.7 6 6 6h56c3.3 0 6-2.7 6-6s-2.7-6-6-6z"
              />
            </svg>
          }
          onClick={onConnectPhantom}
          isLoading={isConnecting}
        />

        {/* MetaMask */}
        <WalletOption
          name="MetaMask"
          description="Ethereum"
          gradient="from-[#f6851b] to-[#e2761b]"
          icon={
            <svg viewBox="0 0 318.6 318.6" width="28" height="28">
              <polygon
                fill="#e2761b"
                stroke="#e2761b"
                points="274.1,35.5 174.6,109.4 193,65.8"
              />
              <polygon
                fill="#e4761b"
                stroke="#e4761b"
                points="44.4,35.5 143.1,110.1 125.6,65.8"
              />
              <polygon
                fill="#e4761b"
                stroke="#e4761b"
                points="238.3,206.8 211.8,247.4 268.5,263 284.8,207.7"
              />
              <polygon
                fill="#e4761b"
                stroke="#e4761b"
                points="33.9,207.7 50.1,263 106.8,247.4 80.3,206.8"
              />
              <polygon
                fill="#e4761b"
                stroke="#e4761b"
                points="103.6,138.2 87.8,162.1 144.1,164.6 142.1,104.1"
              />
              <polygon
                fill="#e4761b"
                stroke="#e4761b"
                points="214.9,138.2 175.9,103.4 174.6,164.6 230.8,162.1"
              />
              <polygon
                fill="#e4761b"
                stroke="#e4761b"
                points="106.8,247.4 140.6,230.9 111.4,208.1"
              />
              <polygon
                fill="#e4761b"
                stroke="#e4761b"
                points="177.9,230.9 211.8,247.4 207.1,208.1"
              />
              <polygon
                fill="#d7c1b3"
                stroke="#d7c1b3"
                points="211.8,247.4 177.9,230.9 180.6,253 180.3,262.3"
              />
              <polygon
                fill="#d7c1b3"
                stroke="#d7c1b3"
                points="106.8,247.4 138.3,262.3 138.1,253 140.6,230.9"
              />
              <polygon
                fill="#233447"
                stroke="#233447"
                points="138.8,193.5 110.6,185.2 130.5,176.1"
              />
              <polygon
                fill="#233447"
                stroke="#233447"
                points="179.7,193.5 188,176.1 208,185.2"
              />
              <polygon
                fill="#cd6116"
                stroke="#cd6116"
                points="106.8,247.4 111.6,206.8 80.3,207.7"
              />
              <polygon
                fill="#cd6116"
                stroke="#cd6116"
                points="207,206.8 211.8,247.4 238.3,207.7"
              />
              <polygon
                fill="#cd6116"
                stroke="#cd6116"
                points="230.8,162.1 174.6,164.6 179.8,193.5 188.1,176.1 208.1,185.2"
              />
              <polygon
                fill="#cd6116"
                stroke="#cd6116"
                points="110.6,185.2 130.6,176.1 138.8,193.5 144.1,164.6 87.8,162.1"
              />
              <polygon
                fill="#e4751f"
                stroke="#e4751f"
                points="87.8,162.1 111.4,208.1 110.6,185.2"
              />
              <polygon
                fill="#e4751f"
                stroke="#e4751f"
                points="208.1,185.2 207.1,208.1 230.8,162.1"
              />
              <polygon
                fill="#e4751f"
                stroke="#e4751f"
                points="144.1,164.6 138.8,193.5 145.4,227.6 146.9,182.7"
              />
              <polygon
                fill="#e4751f"
                stroke="#e4751f"
                points="174.6,164.6 171.9,182.6 173.1,227.6 179.8,193.5"
              />
              <polygon
                fill="#f6851b"
                stroke="#f6851b"
                points="179.8,193.5 173.1,227.6 177.9,230.9 207.1,208.1 208.1,185.2"
              />
              <polygon
                fill="#f6851b"
                stroke="#f6851b"
                points="110.6,185.2 111.4,208.1 140.6,230.9 145.4,227.6 138.8,193.5"
              />
              <polygon
                fill="#c0ad9e"
                stroke="#c0ad9e"
                points="180.3,262.3 180.6,253 178.1,250.8 140.4,250.8 138.1,253 138.3,262.3 106.8,247.4 117.8,256.4 140.1,271.9 178.4,271.9 200.8,256.4 211.8,247.4"
              />
              <polygon
                fill="#161616"
                stroke="#161616"
                points="177.9,230.9 173.1,227.6 145.4,227.6 140.6,230.9 138.1,253 140.4,250.8 178.1,250.8 180.6,253"
              />
              <polygon
                fill="#763d16"
                stroke="#763d16"
                points="278.3,114.2 286.8,73.4 274.1,35.5 177.9,106.9 214.9,138.2 267.2,153.5 278.8,140 273.8,136.4 281.8,129.1 275.6,124.3 283.6,118.2"
              />
              <polygon
                fill="#763d16"
                stroke="#763d16"
                points="31.8,73.4 40.3,114.2 34.9,118.2 42.9,124.3 36.8,129.1 44.8,136.4 39.8,140 51.3,153.5 103.6,138.2 140.6,106.9 44.4,35.5"
              />
              <polygon
                fill="#f6851b"
                stroke="#f6851b"
                points="267.2,153.5 214.9,138.2 230.8,162.1 211.8,207.7 238.3,207.4 278.8,207.4"
              />
              <polygon
                fill="#f6851b"
                stroke="#f6851b"
                points="103.6,138.2 51.3,153.5 40.1,207.4 80.3,207.4 106.8,207.7 87.8,162.1"
              />
              <polygon
                fill="#f6851b"
                stroke="#f6851b"
                points="174.6,164.6 177.9,106.9 193.1,65.8 125.6,65.8 140.6,106.9 144.1,164.6 145.3,182.8 145.4,227.6 173.1,227.6 173.3,182.8"
              />
            </svg>
          }
          onClick={onConnectMetaMask}
          isLoading={isConnecting}
        />
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-border">
        <p className="text-xs text-foreground-tertiary text-center">
          Don&apos;t have a wallet?{' '}
          <a
            href="https://chromewebstore.google.com/detail/catena-wallet/jjjjbhackagenhoidaapdaloghfkckda"
            target="_blank"
            rel="noopener noreferrer"
            className="text-success hover:underline"
          >
            Install Catena
          </a>
        </p>
      </div>
    </Modal>
  );
};
