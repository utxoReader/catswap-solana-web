import React from "react";

// Task #195 前端期权页骨架（K3 派单：菜单占位+交易页骨架）。
// Phase 1 链上功能已验收（建系列/买入/cap 闸/到期冻结/自结算）；
// 前端数据接线进行中——本页为界面骨架+演示数据，诚实标注。
// 样式：主题变量+OKX 语义色（call=绿 put=红，仅买卖/多空语义用色）。

interface DemoSeries {
  kind: "call" | "put";
  strike: number;
  expiry: string;
  ivPct: number;
  premium: number; // 每单位权利金（演示）
  qty: number;
}

const DEMO_SERIES: DemoSeries[] = [
  { kind: "call", strike: 110, expiry: "7D", ivPct: 80, premium: 4.22, qty: 0 },
  { kind: "call", strike: 100, expiry: "7D", ivPct: 80, premium: 7.41, qty: 0 },
  { kind: "put", strike: 90, expiry: "7D", ivPct: 80, premium: 3.18, qty: 0 },
  { kind: "call", strike: 120, expiry: "30D", ivPct: 75, premium: 5.9, qty: 0 },
  { kind: "put", strike: 80, expiry: "30D", ivPct: 75, premium: 2.4, qty: 0 },
];

const DEMO_POSITIONS = [
  { kind: "call" as const, strike: 100, expiry: "2026-09-27", qty: 5, premium: 37.05, status: "持仓中" },
  { kind: "put" as const, strike: 90, expiry: "2026-09-27", qty: 2, premium: 6.36, status: "已到期 · 待结算" },
];

const fmt = (n: number) => n.toFixed(2);

export const OptionsPage: React.FC = () => {
  const [side, setSide] = React.useState<"call" | "put">("call");
  const [selected, setSelected] = React.useState(0);
  const [qty, setQty] = React.useState("1");
  const series = DEMO_SERIES[selected];
  const qtyNum = Math.max(0, parseFloat(qty) || 0);
  const estPremium = series.premium * qtyNum;

  return (
    <div className="min-h-[calc(100vh-68px)] bg-[var(--bg-primary)] flex flex-col gap-px">
      {/* 诚实标注横幅 */}
      <div className="bg-[var(--bg-secondary)] px-4 py-2 text-xs text-[var(--text-tertiary)]">
        期权 Phase 1 链上功能已上线测试（治理建系列 / 买入 / 到期自动结算）——前端数据接线进行中，以下为界面骨架与演示数据。
      </div>

      {/* 顶部行情条 */}
      <div className="bg-[var(--bg-secondary)] px-4 py-3 flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-white text-xs font-bold">
            C
          </span>
          <div className="flex flex-col">
            <span className="text-base font-semibold text-[var(--text-primary)]">CAT / USDC</span>
            <span className="text-[10px] text-[var(--text-tertiary)]">Options</span>
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-[var(--text-tertiary)] text-xs">标记价 (EMA)</span>
          <span className="text-[var(--text-primary)] font-medium">100.00</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[var(--text-tertiary)] text-xs">IV (治理设定)</span>
          <span className="text-[var(--text-primary)] font-medium">80%</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[var(--text-tertiary)] text-xs">结算价</span>
          <span className="text-[var(--text-primary)] font-medium">到期冻结 EMA</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[var(--text-tertiary)] text-xs">买入截止</span>
          <span className="text-[var(--text-primary)] font-medium">到期前 1h</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-px">
        {/* 左：系列列表 */}
        <div className="flex-1 min-w-0 bg-[var(--bg-secondary)] p-4">
          <div className="text-sm font-medium text-[var(--text-primary)] mb-3">系列列表</div>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[var(--text-tertiary)] text-left">
                <th className="py-2 font-normal">类型</th>
                <th className="py-2 font-normal">行权价</th>
                <th className="py-2 font-normal">到期</th>
                <th className="py-2 font-normal">IV</th>
                <th className="py-2 font-normal">权利金/单位</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_SERIES.map((s, i) => (
                <tr
                  key={i}
                  onClick={() => { setSelected(i); setSide(s.kind); }}
                  className={`cursor-pointer border-t border-[var(--border-primary)] ${
                    i === selected ? "bg-[var(--bg-tertiary)]" : "hover:bg-[var(--bg-tertiary)]"
                  }`}
                >
                  <td className="py-2">
                    <span className={s.kind === "call" ? "text-[#25A750]" : "text-[#CA3F64]"}>
                      {s.kind === "call" ? "Call" : "Put"}
                    </span>
                  </td>
                  <td className="py-2 text-[var(--text-primary)]">{s.strike}</td>
                  <td className="py-2 text-[var(--text-primary)]">{s.expiry}</td>
                  <td className="py-2 text-[var(--text-primary)]">{s.ivPct}%</td>
                  <td className="py-2 text-[var(--text-primary)]">{fmt(s.premium)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 text-[10px] text-[var(--text-tertiary)]">
            欧式现金交割 · 到期按冻结结算价自动结算 · 持有到期是 v1 唯一退出方式
          </div>
        </div>

        {/* 右：买入表单 */}
        <div className="w-full lg:w-[320px] shrink-0 bg-[var(--bg-secondary)] p-4 flex flex-col gap-3">
          {/* Call/Put 切换 */}
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => setSide("call")}
              className={`h-7 rounded text-xs font-medium transition-colors ${
                side === "call"
                  ? "bg-[#25A750] text-white"
                  : "bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Call
            </button>
            <button
              onClick={() => setSide("put")}
              className={`h-7 rounded text-xs font-medium transition-colors ${
                side === "put"
                  ? "bg-[#CA3F64] text-white"
                  : "bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Put
            </button>
          </div>

          <div>
            <div className="text-xs text-[var(--text-tertiary)] mb-1">行权价</div>
            <input
              value={series.strike}
              readOnly
              className="w-full h-[38px] bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded px-3 text-sm text-[var(--text-primary)]"
            />
          </div>
          <div>
            <div className="text-xs text-[var(--text-tertiary)] mb-1">数量</div>
            <input
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              inputMode="decimal"
              className="w-full h-[38px] bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded px-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--text-primary)]"
            />
          </div>

          <div className="text-xs space-y-1 pt-1">
            <div className="flex justify-between">
              <span className="text-[var(--text-tertiary)]">权利金预估</span>
              <span className="text-[var(--text-primary)]">{fmt(estPremium)} USDC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-tertiary)]">到期</span>
              <span className="text-[var(--text-primary)]">{series.expiry}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-tertiary)]">结算方式</span>
              <span className="text-[var(--text-primary)]">到期自动 · 欧式</span>
            </div>
          </div>

          <button
            disabled
            title="数据接线进行中"
            className={`mt-2 h-10 rounded-full text-sm font-normal text-white cursor-not-allowed opacity-40 ${
              side === "call" ? "bg-[#25A750] hover:bg-[#219246]" : "bg-[#CA3F64] hover:bg-[#B3385A]"
            }`}
          >
            {side === "call" ? "Buy Call" : "Buy Put"}
          </button>
          <div className="text-[10px] text-[var(--text-tertiary)] text-center">
            买入按钮待链上数据接线后启用
          </div>
        </div>
      </div>

      {/* 底：持仓列表 */}
      <div className="bg-[var(--bg-secondary)] p-4">
        <div className="text-sm font-medium text-[var(--text-primary)] mb-3">我的期权</div>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[var(--text-tertiary)] text-left">
              <th className="py-2 font-normal">类型</th>
              <th className="py-2 font-normal">行权价</th>
              <th className="py-2 font-normal">到期日</th>
              <th className="py-2 font-normal">数量</th>
              <th className="py-2 font-normal">已付权利金</th>
              <th className="py-2 font-normal">状态</th>
              <th className="py-2 font-normal">操作</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_POSITIONS.map((p, i) => (
              <tr key={i} className="border-t border-[var(--border-primary)]">
                <td className="py-2">
                  <span className={p.kind === "call" ? "text-[#25A750]" : "text-[#CA3F64]"}>
                    {p.kind === "call" ? "Call" : "Put"}
                  </span>
                </td>
                <td className="py-2 text-[var(--text-primary)]">{p.strike}</td>
                <td className="py-2 text-[var(--text-primary)]">{p.expiry}</td>
                <td className="py-2 text-[var(--text-primary)]">{p.qty}</td>
                <td className="py-2 text-[var(--text-primary)]">{fmt(p.premium)} USDC</td>
                <td className="py-2 text-[var(--text-primary)]">{p.status}</td>
                <td className="py-2">
                  <button
                    disabled
                    title="数据接线进行中"
                    className="h-7 px-3 rounded-full border border-[var(--border-primary)] text-[var(--text-tertiary)] text-xs cursor-not-allowed"
                  >
                    结算
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
