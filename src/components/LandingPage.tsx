import React from "react";
import { Link } from "react-router-dom";
import { useLang } from "../i18n/LangContext";

// 应用根路由的 landing（与 catswap-docs 宣传页 v2 同源内容，轻量 React 版）。
// 概念层口径：零参数值、零公式、零阈值；"二期/路线"为诚实标注。

// 文档站基址：直接用线上正式域名（本地预览服务会随重建抖动，不再依赖）；可用 VITE_DOCS_URL 覆盖
const DOCS_BASE_URL = (
  (import.meta.env.VITE_DOCS_URL as string | undefined) ||
  "https://docs.catswap.com"
).replace(/\/$/, "");

const docUrl = (path: string) => `${DOCS_BASE_URL}${path}`;

const AXIOMS = [
  {
    titleKey: "landing.axiom1.title",
    descKey: "landing.axiom1.desc",
    to: "/docs/philosophy/pool-is-market",
  },
  {
    titleKey: "landing.axiom2.title",
    descKey: "landing.axiom2.desc",
    to: "/docs/philosophy/one-pool",
  },
  {
    titleKey: "landing.axiom3.title",
    descKey: "landing.axiom3.desc",
    to: "/docs/philosophy/anti-manipulation",
  },
];

const ADVANTAGES: {
  title: string;
  tag?: string;
  to: string;
  description: string;
}[] = [
  {
    title: '爆仓不归零',
    to: '/docs/product/nothing-lost',
    description: '仓位被清算，扣完欠款和罚金，剩下的钱退回给你。我们不没收剩余保证金——每笔赔付都在链上，随时可查。',
  },
  {
    title: "给合规资产留了门",
    to: "/docs/product/spot-margin-perp",
    tag: "路线",
    description:
      "受监管的资产要合规准入——许可池让发行方用白名单决定谁能交易。能力已经留在协议里，等发行方和监管配合。",
  },
  {
    title: "现货、杠杆、合约共用一个池",
    to: "/docs/philosophy/one-pool",
    description:
      "现货、杠杆、永续共用一份流动性和一个保证金账户，不用来回搬运。借款不离开池子，利用率高的时候，LP 赚得更多。",
  },
  {
    title: "对冲策略不用跨平台",
    to: "/docs/product/hedging",
    description:
      "买现货、开空单，一个账户里完成。现货就是保证金，不用跑到两个平台各存一份钱。",
  },
  {
    title: "组合保证金",
    to: "/docs/product/portfolio-margin",
    description:
      "组合保证金账户里，一份保证金覆盖所有仓位。浮盈能救浮亏，对冲组合少占资金，清算看总账而不是单笔。",
  },
  {
    title: "价格来自池内，反价格操纵",
    to: "/docs/philosophy/anti-manipulation",
    description:
      "价格是池子里真实成交打出来的，记账用平滑价，插针打不进来。越偏离，操纵的人付得越多。",
  },
  {
    title: "费用分账链上可查",
    to: "/docs/philosophy/anti-manipulation",
    description:
      "手续费、利息、罚金按链上公开规则分成——多数费种 LP 拿大头。分账规则链上可查，没有暗箱。",
  },
  {
    title: "LP 风险可对冲",
    to: "/docs/product/spot-margin-perp",
    tag: "二期",
    description:
      "协议算得清 LP 手里压着什么货、风险多大。将来能在同一个账户里反向对冲（二期），不用移到别处。",
  },
  {
    title: "新代币上线就能交易",
    to: "/docs/product/launch",
    description:
      "发币方给个代币就能开盘，不用垫配对资金。开盘当天现货、杠杆、永续一起有，没有迁移期。",
  },
  {
    title: "发币方持续分手续费",
    to: "/docs/product/launch",
    description:
      "发币方从每笔交易持续分成，还有推荐奖励。上币不是一锤子买卖。",
  },
  {
    title: "极端行情掏不空",
    to: "/docs/philosophy/anti-manipulation",
    description:
      "单笔交易最多拿走池内储备的一半，池子掏不空；没有 ADL，你的盈利仓位不会被拿来分摊别人的亏损。",
  },
];

export const LandingPage: React.FC = () => {
  const { t } = useLang();
  return (
    <div className="min-h-screen bg-[#0B0E11] text-white">
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 pt-20 pb-14 text-center">
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">
          {t("landing.hero.title")}
        </h1>
        <p className="mt-5 text-base sm:text-lg text-white/70 max-w-2xl mx-auto">
          {t("landing.hero.subtitle")}
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/trade"
            className="w-full sm:w-auto px-8 h-11 flex items-center justify-center rounded-full text-sm font-normal bg-[#25A750] text-white hover:bg-[#25A750]/90 transition-colors"
          >
            {t("landing.cta.trade")}
          </Link>
          <Link
            to="/pools"
            className="w-full sm:w-auto px-8 h-11 flex items-center justify-center rounded-full text-sm font-normal text-white/75 hover:text-white transition-colors"
          >
            {t("landing.cta.pools")}
          </Link>
          <a
            href={docUrl("/docs/intro")}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-8 h-11 flex items-center justify-center rounded-full text-sm font-normal text-white/75 hover:text-white transition-colors"
          >
            {t("landing.cta.docs")}
          </a>
        </div>
      </section>

      {/* 股票代币专节 */}
      <section className="max-w-5xl mx-auto px-4 py-14 border-t border-white/10">
        <h2 className="text-sm font-medium text-white/75 tracking-[0.2em] text-center">
          为股票代币而建
        </h2>
        <p className="mt-2 mb-10 text-sm text-center text-white/60 max-w-2xl mx-auto">
          股票市场的流动性远大于加密市场现有总量。代币化股票需要合规准入、可靠定价和极端行情下的安全保障——这三件事恰好是
          CatSwap 的原生能力。
        </p>
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <h3 className="text-base font-semibold text-center">
              {t("landing.stock.card1.title")}
            </h3>
            <p className="mt-2 text-sm text-white/65 leading-relaxed text-center">
              {t("landing.stock.card1.desc")}
            </p>
          </div>
          <div>
            <h3 className="text-base font-semibold text-center">{t("landing.stock.card2.title")}</h3>
            <p className="mt-2 text-sm text-white/65 leading-relaxed text-center">
              {t("landing.stock.card2.desc")}
            </p>
          </div>
          <div>
            <h3 className="text-base font-semibold text-center">
              {t("landing.stock.card3.title")}
            </h3>
            <p className="mt-2 text-sm text-white/65 leading-relaxed text-center">
              {t("landing.stock.card3.desc")}
            </p>
          </div>
        </div>
      </section>

      {/* 三个设计选择 */}
      <section className="max-w-5xl mx-auto px-4 py-12 border-t border-white/10">
        <h2 className="text-sm font-medium text-white/75 tracking-[0.2em] text-center mb-8">
          三个设计选择
        </h2>
        <div className="grid gap-10 sm:grid-cols-3">
          {AXIOMS.map((a) => (
            <div key={a.titleKey}>
              <h3 className="text-base font-semibold text-center">
                <a
                  href={docUrl(a.to)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#25A750] transition-colors"
                >
                  {t(a.titleKey)}
                </a>
              </h3>
              <p className="mt-2 text-sm text-white/65 leading-relaxed text-center">
                {t(a.descKey)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 八条卖点 */}
      <section className="max-w-5xl mx-auto px-4 py-12 border-t border-white/10">
        <h2 className="text-sm font-medium text-white/75 tracking-[0.2em] text-center">
          我们不一样的地方
        </h2>
        <p className="mt-2 mb-10 text-sm text-center text-white/60">
          下面每条都写在代码里，谁都可以上链核对。
        </p>
        <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {ADVANTAGES.map((item) => (
            <div key={item.title}>
              <h3 className="text-sm font-semibold text-white">
                <a
                  href={docUrl(item.to)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#25A750] transition-colors"
                >
                  {item.title}
                </a>
                {item.tag && (
                  <span className="ml-1.5 text-[10px] font-normal text-white/45">
                    ［{item.tag}］
                  </span>
                )}
              </h3>
              <p className="mt-2 text-[13px] text-white/60 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer className="py-8 text-center text-xs text-white/40 border-t border-white/10">
        CatSwap · 统一交易协议 · 链上价格为唯一定价来源
      </footer>
    </div>
  );
};

export default LandingPage;
