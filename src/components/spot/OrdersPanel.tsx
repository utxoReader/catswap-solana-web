import React, { useState } from 'react';
// WalletInfo removed '../../types';

type TabType = 'open_orders' | 'order_history' | 'open_positions' | 'position_history' | 'assets' | 'bots';

interface OrdersPanelProps {
  connected: boolean;
  publicKey: string;
}

const TABS = [
  { id: 'open_orders' as TabType, label: 'Open orders' },
  { id: 'order_history' as TabType, label: 'Order history' },
  { id: 'open_positions' as TabType, label: 'Open positions' },
  { id: 'position_history' as TabType, label: 'Position history' },
  { id: 'assets' as TabType, label: 'Assets' },
  { id: 'bots' as TabType, label: 'Bots' },
];

export const OrdersPanel: React.FC<OrdersPanelProps> = ({ connected }: OrdersPanelProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('open_orders');

  const renderEmptyState = (message: string) => (
    <div className="h-full flex flex-col items-center justify-center text-[var(--text-secondary)]">
      <svg 
        className="w-12 h-12 mb-3 opacity-30" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={1} 
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" 
        />
      </svg>
      <span className="text-sm">{message}</span>
    </div>
  );

  const renderContent = () => {
    if (!connected) {
      return renderEmptyState('Log in to view your orders');
    }

    switch (activeTab) {
      case 'open_orders':
        return renderEmptyState('No open orders');
      case 'order_history':
        return renderEmptyState('No order history');
      case 'open_positions':
        return renderEmptyState('No open positions');
      case 'position_history':
        return renderEmptyState('No position history');
      case 'assets':
        return renderEmptyState('No assets');
      case 'bots':
        return renderEmptyState('No trading bots');
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Tabs Header */}
      <div className="flex items-center gap-1 px-2 border-b border-[var(--border-primary)] overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-3 py-2 text-xs whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'text-[var(--text-primary)] font-medium'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--text-primary)]" />
            )}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default OrdersPanel;
