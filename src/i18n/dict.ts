// 双语字典：纯数据，键 → { zh, en }。默认语言为 zh。
export type Lang = "zh" | "en";

export interface DictEntry {
  zh: string;
  en: string;
}

export const dict: Record<string, DictEntry> = {
  // Header 导航
  "nav.spot": { zh: "现货", en: "Spot" },
  "nav.perps": { zh: "永续", en: "Perps" },
  "nav.options": { zh: "期权", en: "Options" },
  "nav.pools": { zh: "流动池", en: "Pools" },
  "nav.launch": { zh: "发射", en: "Launch" },
  "nav.referral": { zh: "推荐", en: "Referral" },

  // Landing hero
  "landing.hero.title": {
    zh: "为股票代币而生的统一交易协议",
    en: "The Unified Trading Protocol for Stock Tokens",
  },
  "landing.hero.subtitle": {
    zh: "现货、杠杆、永续在同一个池子里交易，价格由池内真实交易决定，不需要外部预言机。",
    en: "Spot, margin, and perps trade in one pool — priced by real trades, with no external oracle.",
  },
  "landing.cta.trade": { zh: "进入交易", en: "Start Trading" },
  "landing.cta.pools": { zh: "查看流动池", en: "View Pools" },
  "landing.cta.docs": { zh: "查看文档", en: "Read the Docs" },

  // Landing 股票代币专节（三张卡）
  "landing.stock.card1.title": { zh: "发行人管准入", en: "Issuers Control Access" },
  "landing.stock.card1.desc": {
    zh: "许可池让发行人用白名单决定谁能交易——与监管机构认可的市场结构同型，合规资产可以放心进场。",
    en: "Permissioned pools let issuers whitelist who can trade — the same market structure regulators recognize, so compliant assets can list with confidence.",
  },
  "landing.stock.card2.title": { zh: "7×24 不停市", en: "24/7, Never Closes" },
  "landing.stock.card2.desc": {
    zh: "链上没有开盘收盘。股票代币全天候可交易，价格发现不中断——传统市场的开闭市空窗在这里不存在。",
    en: "No opening or closing bell on-chain. Stock tokens trade around the clock with uninterrupted price discovery — market-hour gaps simply don't exist here.",
  },
  "landing.stock.card3.title": { zh: "LP 利益有机制保护", en: "LP Protection Built In" },
  "landing.stock.card3.desc": {
    zh: "操纵者付钱给 LP、单边永远掏不空、盈利仓位永不被动（无 ADL）——提供股票代币流动性的风险由机制兜底。",
    en: "Manipulators pay LPs, one side can never drain the pool, and winning positions are never touched (no ADL) — the risks of providing stock-token liquidity are covered by the mechanism itself.",
  },

  // Landing 三个设计选择（三张卡）
  "landing.axiom1.title": { zh: "不用外部预言机", en: "No External Oracle" },
  "landing.axiom1.desc": {
    zh: "价格只认池子里的真实成交，外部喂价不进来——预言机被操纵这条最常见的攻击路，在我们这里不存在。",
    en: "Prices come only from real trades inside the pool; external price feeds never enter. Oracle manipulation — the most common attack vector — doesn't exist here.",
  },
  "landing.axiom2.title": { zh: "所有交易共用一个池", en: "One Pool for All Trading" },
  "landing.axiom2.desc": {
    zh: "现货、杠杆、永续用同一份流动性和保证金，不用在几个账户之间来回划转。",
    en: "Spot, margin, and perps share the same liquidity and collateral — no shuttling funds back and forth between accounts.",
  },
  "landing.axiom3.title": { zh: "操纵者付钱给 LP", en: "Manipulators Pay LPs" },
  "landing.axiom3.desc": {
    zh: "拉盘砸盘都要按偏离程度多付手续费，这笔钱进池子、归提供流动性的人。",
    en: "Pumps and dumps pay extra fees proportional to their price deviation — and that money goes into the pool, to the liquidity providers.",
  },

  // Launch 页（#238 无许可 meme 发射）
  "launch.title": { zh: "发射新代币", en: "Launch a Token" },
  "launch.subtitle": {
    zh: "无许可发射：全量供应一次性注入，统一发射价 = 0.01 USDC ÷ 全量供应，创建者不掌握定价权。",
    en: "Permissionless launch: the entire supply is seeded in one shot at the unified price — 0.01 USDC ÷ total supply. The creator has no pricing power.",
  },
  "launch.mintLabel": { zh: "代币 Mint 地址", en: "Token Mint Address" },
  "launch.mintPlaceholder": {
    zh: "粘贴已撤销权限的 SPL mint 地址",
    en: "Paste an SPL mint with revoked authorities",
  },
  "launch.supplyLabel": { zh: "全量供应（自动读取）", en: "Total Supply (auto-read)" },
  "launch.quoteSeedLabel": { zh: "Quote 种子", en: "Quote Seed" },
  "launch.quoteSeedFixed": { zh: "固定，不可修改", en: "fixed, not editable" },
  "launch.checklistTitle": { zh: "准入预检", en: "Admission Pre-flight" },
  "launch.check.poolNew": { zh: "池子尚未存在", en: "Pool does not exist yet" },
  "launch.check.poolExists": {
    zh: "该 Mint + USDC 的池子已存在，不能重复创建",
    en: "A pool for this mint + USDC already exists",
  },
  "launch.check.mintAuthority": { zh: "Mint 权限已撤销", en: "Mint authority revoked" },
  "launch.check.freezeAuthority": { zh: "Freeze 权限已撤销", en: "Freeze authority revoked" },
  "launch.check.tax": { zh: "税配置 ≤1% 且税权限已撤销", en: "Tax ≤1% with fee authority revoked" },
  "launch.check.quote": { zh: "Quote 在白名单（USDC）", en: "Quote whitelisted (USDC)" },
  "launch.check.family": { zh: "与 quote 同一 token 程序族", en: "Same token program family as quote" },
  "launch.check.supply": { zh: "钱包持有全量供应", en: "Wallet holds the entire supply" },
  "launch.check.revoked": { zh: "已撤销", en: "revoked" },
  "launch.check.alive": { zh: "未撤销", en: "still alive" },
  "launch.check.noBalance": { zh: "无持仓", en: "no balance" },
  "launch.quoteBalance": { zh: "USDC 余额", en: "USDC balance" },
  "launch.quoteBalanceExact": {
    zh: "链上要求恰好 0.01（多了请先转走）",
    en: "must be exactly 0.01 on-chain (move any excess first)",
  },
  "launch.button": { zh: "发射", en: "Launch" },
  "launch.launching": { zh: "发射中…", en: "Launching…" },
  "launch.connect": { zh: "连接钱包以发射", en: "Connect Wallet to Launch" },
  "launch.footer": {
    zh: "发射为原子三指令组：建池 + Track M 模板 + 发射状态，一笔交易全成或全败。保护窗约 10 分钟后开放交易。",
    en: "Launch is an atomic trio — pool + Track M template + launch state in one all-or-nothing transaction. Trading opens after a ~10 minute protection window.",
  },
  "launch.error.badAddress": { zh: "不是合法的地址", en: "Not a valid address" },
  "launch.error.mintNotFound": { zh: "链上找不到该 mint 账户", en: "Mint account not found on-chain" },
  "launch.error.notMint": { zh: "该地址不是 SPL/Token-2022 mint", en: "Not an SPL / Token-2022 mint" },
  "launch.error.rpc": { zh: "链上读取失败（RPC 暂不可用）", en: "Chain read failed (RPC unavailable)" },
  "launch.success.title": { zh: "发射成功", en: "Launch Successful" },
  "launch.success.pool": { zh: "池地址", en: "Pool Address" },
  "launch.success.sig": { zh: "交易签名", en: "Transaction Signature" },
  "launch.success.lockNote": {
    zh: "创世 LP 头寸出生即永久锁（permanent_lock=true，链上无解锁路径）：全量供应与 0.01 USDC 种子永远留在池内，创建者无法撤池跑路。",
    en: "The genesis LP position is born permanently locked (permanent_lock=true — no unlock path exists on-chain): the entire supply and the 0.01 USDC seed stay in the pool forever. The creator cannot rug the liquidity.",
  },
  "launch.success.windowNote": {
    zh: "交易将在保护窗结束后开放（窗口内有单笔限额与递增开盘费保护）。",
    en: "Trading opens after the protection window (per-buy caps and a decaying open fee apply during the window).",
  },
  "launch.success.windowEnd": { zh: "预计开放", en: "opens at" },
  "launch.success.feeInvReady": {
    zh: "if_fee_inv 已就绪，保护窗结束即可交易。",
    en: "if_fee_inv is ready — trading can start when the window ends.",
  },
  "launch.success.feeInvPending": {
    zh: "交易前还需 fund admin 初始化 if_fee_inv 账户（自愈调用已尝试，当前钱包不是 admin）。admin",
    en: "Trading still requires the fund admin to initialize the if_fee_inv account (self-heal attempted; this wallet is not the admin). admin",
  },
  "launch.success.again": { zh: "再发射一个", en: "Launch Another" },
};
