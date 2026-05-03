"use client";

/* eslint-disable @next/next/no-img-element */

import {
  ArrowRight,
  BarChart3,
  Bell,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Cpu,
  FileCheck2,
  KeyRound,
  LineChart,
  LockKeyhole,
  Menu,
  MonitorCheck,
  MousePointer2,
  Phone,
  ScanSearch,
  ShieldCheck,
  Smartphone,
  Sparkles,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const asset = (path: string) => `${basePath}${path}`;

type ShowcaseItem = {
  title: string;
  description: string;
  src: string;
};

type MascotPose = "surprised" | "thumbs" | "glasses";

const mascotSrc: Record<MascotPose, string> = {
  surprised: "/mascots/robot-bull-surprised.png",
  thumbs: "/mascots/robot-bull-thumbs-up.png",
  glasses: "/mascots/robot-bull-glasses.png"
};

const navItems = [
  { label: "首頁", href: "#home" },
  { label: "系統特色", href: "#features" },
  { label: "產品展示", href: "#showcase" },
  { label: "流程", href: "#process" },
  { label: "FAQ", href: "#faq" },
  { label: "聯絡我們", href: "#contact" }
];

const valueCards = [
  {
    title: "規則量化",
    text: "把交易邏輯整理成可執行條件，降低模糊判斷。",
    icon: ClipboardCheck
  },
  {
    title: "歷史回測",
    text: "用歷史資料檢查規則表現，輔助評估風險與穩定性。",
    icon: LineChart
  },
  {
    title: "安裝部署",
    text: "透過安裝精靈完成 API、憑證、權限與模擬 / 實盤設定。",
    icon: MonitorCheck
  },
  {
    title: "手機遠端控制",
    text: "手機查看策略、接收提醒、切換模式，並以預算輔助下單。",
    icon: Smartphone
  }
];

const processSteps = [
  "提供交易想法",
  "規則量化",
  "歷史資料回測",
  "整理成策略規格包",
  "部署交易系統",
  "執行 / 監控 / 下單"
];

const showcaseItems: ShowcaseItem[] = [
  {
    title: "完整流程總覽",
    description: "從規則、量化、回測、部署到手機端執行，完整展示系統架構。",
    src: "/images/01-business-flow.png"
  },
  {
    title: "量化模型介紹",
    description: "將策略邏輯整理成可回測、可客製化、可部署的模型。",
    src: "/images/02-quant-model.png"
  },
  {
    title: "PC 安裝精靈",
    description: "引導使用者完成 API Key、Secret Key、CA 憑證與交易模式設定。",
    src: "/images/03-pc-installer.png"
  },
  {
    title: "手機端控制",
    description: "手機查看已購策略、切換模擬 / 實盤、查看可用資金並以預算下單。",
    src: "/images/04-mobile-interface.png"
  }
];

const installerItems = [
  "API Key / Secret Key",
  "CA 憑證檔 Sinopac.pfx",
  "CA 憑證密碼",
  "交易帳號",
  "模擬 / 實盤模式",
  "測試連線",
  "開始安裝"
];

const mobileItems = [
  "已連線家中主機",
  "模擬 / 實盤切換",
  "我的已購策略",
  "策略說明影片",
  "永豐證券可用資金",
  "預算下單",
  "預估可買股數",
  "送出委託"
];

const complianceCards = [
  {
    title: "使用者自訂條件",
    text: "策略條件、股票池與風險參數由使用者自行設定。",
    icon: MousePointer2
  },
  {
    title: "規則掃描",
    text: "系統依條件顯示符合規則的結果，不替使用者做投資決策。",
    icon: ScanSearch
  },
  {
    title: "下單輔助",
    text: "提供預算試算、委託流程與提醒，實際下單由使用者確認。",
    icon: FileCheck2
  },
  {
    title: "非投資建議",
    text: "本系統不提供個股推薦、投資建議或收益承諾，使用者須自行評估投資風險。",
    icon: ShieldCheck
  }
];

const faqs = [
  {
    q: "這是券商 App 嗎？",
    a: "不是。本系統是交易規則量化與下單輔助工具，協助使用者整理規則、檢查流程與遠端操作交易系統。"
  },
  {
    q: "系統會推薦股票嗎？",
    a: "不會。系統依使用者設定的條件顯示符合規則的結果，不提供個股投資建議。"
  },
  {
    q: "是否接劵商 API？",
    a: "產品設計方向包含永豐 API 安裝精靈，協助使用者整理 API Key、CA 憑證與模擬 / 實盤流程。實際使用仍需使用者自行完成券商帳戶、API 與憑證申請。"
  },
  {
    q: "手機端可以做什麼？",
    a: "手機端可查看策略狀態、接收提醒、切換模擬 / 實盤、查看可用資金，並以預算下單方式輔助使用者送出委託。"
  },
  {
    q: "這套系統會承諾收益嗎？",
    a: "不會。任何策略與回測都不代表未來績效，本系統僅作為工具與流程輔助。"
  }
];

function LogoMark() {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white shadow-soft">
      <BarChart3 className="h-6 w-6" aria-hidden="true" />
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  body
}: {
  eyebrow: string;
  title: string;
  body?: string;
}) {
  return (
    <div className="mx-auto mb-10 max-w-3xl text-center">
      <p className="mb-3 text-sm font-bold text-primary">{eyebrow}</p>
      <h2 className="text-3xl font-bold tracking-normal text-ink md:text-4xl">{title}</h2>
      {body && <p className="mt-4 text-base leading-8 text-muted md:text-lg">{body}</p>}
    </div>
  );
}

function MascotImage({
  pose,
  className
}: {
  pose: MascotPose;
  className: string;
}) {
  return (
    <img
      src={asset(mascotSrc[pose])}
      alt=""
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
    />
  );
}

function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-stroke/80 bg-white/88 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <a href="#home" className="flex items-center gap-3">
          <LogoMark />
          <span>
            <span className="block text-base font-extrabold text-ink sm:text-lg">自動量化交易系統</span>
            <span className="hidden text-xs text-muted sm:block">把規則變成可量化、可驗證、可執行的流程</span>
          </span>
        </a>
        <nav className="hidden items-center gap-7 text-sm font-semibold text-ink/80 lg:flex" aria-label="主導覽">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="transition hover:text-primary">
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a
            href="#contact"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-soft transition hover:bg-[#0d56c5]"
          >
            預約演示
          </a>
          <button
            aria-label="開啟選單"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-stroke text-ink lg:hidden"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-stroke bg-white px-4 py-3 lg:hidden" aria-label="手機導覽">
          <div className="mx-auto grid max-w-7xl gap-2">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-ink hover:bg-mist"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}

function HeroVisual() {
  return (
    <div className="relative min-h-[520px] overflow-hidden rounded-lg border border-stroke bg-white shadow-soft">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(238,246,255,0.96),rgba(255,255,255,0.65)_48%,rgba(217,234,254,0.82))]" />
      <MascotImage
        pose="surprised"
        className="absolute -bottom-6 -left-5 z-20 w-32 drop-shadow-[0_18px_28px_rgba(11,31,77,0.16)] sm:w-40 lg:w-48"
      />
      <div className="absolute right-6 top-6 flex items-center gap-2 rounded-lg border border-stroke bg-white/85 px-3 py-2 text-sm font-bold text-ink shadow-card">
        <span className="h-2.5 w-2.5 rounded-full bg-success" />
        Demo Ready
      </div>
      <div className="relative grid h-full gap-4 p-5 sm:p-7">
        <div className="grid gap-4 md:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-lg border border-stroke bg-white p-4 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-bold text-primary">流程總覽</span>
              <Cpu className="h-5 w-5 text-primary" />
            </div>
            <img
              src={asset("/images/01-business-flow.png")}
              alt="交易流程總覽示意"
              className="h-52 w-full rounded-lg object-cover object-top"
            />
          </div>
          <div className="grid gap-4">
            <div className="rounded-lg border border-stroke bg-white p-4 shadow-card">
              <div className="mb-3 flex items-center gap-2 text-sm font-bold text-ink">
                <KeyRound className="h-4 w-4 text-primary" />
                安裝部署
              </div>
              <img
                src={asset("/images/03-pc-installer.png")}
                alt="PC 安裝精靈介面"
                className="h-32 w-full rounded-lg object-cover object-top"
              />
            </div>
            <div className="rounded-lg border border-stroke bg-white p-4 shadow-card">
              <div className="mb-3 flex items-center gap-2 text-sm font-bold text-ink">
                <Phone className="h-4 w-4 text-primary" />
                手機掌控
              </div>
              <img
                src={asset("/images/04-mobile-interface.png")}
                alt="手機端控制介面"
                className="h-32 w-full rounded-lg object-cover object-top"
              />
            </div>
          </div>
        </div>
        <div className="grid gap-3 rounded-lg border border-stroke bg-white/88 p-4 shadow-card sm:grid-cols-3">
          {["規則為核心", "快速部署", "手機掌控"].map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm font-bold text-ink">
              <CheckCircle2 className="h-5 w-5 text-success" />
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HeroSection() {
  return (
    <section id="home" className="relative overflow-hidden px-4 pb-14 pt-12 sm:px-6 lg:px-8 lg:pb-20 lg:pt-16">
      <div className="absolute inset-x-0 top-0 -z-10 h-[760px] bg-[radial-gradient(circle_at_72%_18%,rgba(47,128,237,0.18),transparent_32%),linear-gradient(180deg,#eef6ff_0%,rgba(255,255,255,0)_72%)]" />
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.92fr_1.08fr]">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-bold text-primary shadow-card">
            <Sparkles className="h-4 w-4" />
            專業產品展示網站
          </div>
          <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-normal text-ink md:text-5xl lg:text-6xl">
            <span className="block">把交易規則</span>
            <span className="block">變成可量化、可驗證</span>
            <span className="block">可執行的系統</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-9 text-muted">
            從交易想法、規則量化、歷史回測，到安裝部署與手機遠端控制，讓策略流程更清楚、可控、可展示。
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#showcase"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3.5 text-base font-bold text-white shadow-soft transition hover:bg-[#0d56c5]"
            >
              查看系統架構
              <ArrowRight className="h-5 w-5" />
            </a>
            <a
              href="#process"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-white px-6 py-3.5 text-base font-bold text-primary shadow-card transition hover:border-primary"
            >
              了解產品流程
            </a>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              ["規則為核心", "以使用者定義的條件運作"],
              ["快速部署", "從 API 安裝到手機監控"],
              ["手機掌控", "查看策略、提醒與預算下單"]
            ].map(([title, text]) => (
              <div key={title} className="rounded-lg border border-stroke bg-white/82 p-4 shadow-card">
                <p className="text-sm font-extrabold text-ink">{title}</p>
                <p className="mt-2 text-sm leading-6 text-muted">{text}</p>
              </div>
            ))}
          </div>
        </div>
        <HeroVisual />
      </div>
    </section>
  );
}

function ValueCards() {
  return (
    <section id="features" className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="核心價值"
          title="把交易流程拆成清楚、可驗證的模組"
          body="每個階段都有明確輸入、驗證方式與操作邊界，讓產品價值與使用流程更清楚。"
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {valueCards.map(({ title, text, icon: Icon }) => (
            <article key={title} className="rounded-lg border border-stroke bg-white p-6 shadow-card">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-mist text-primary">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-extrabold text-ink">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-muted">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProcessTimeline() {
  return (
    <section id="process" className="bg-mist/70 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="6 大流程"
          title="從想法到執行，清楚的 6 大步驟"
          body="把交易想法整理成系統規格，接著回測、部署、監控，形成可討論也可落地的工作流程。"
        />
        <div className="grid gap-3 lg:grid-cols-6">
          {processSteps.map((step, index) => (
            <div key={step} className="relative">
              <div className="h-full rounded-lg border border-stroke bg-white p-5 shadow-card">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-sm font-black text-white">
                  {index + 1}
                </div>
                <p className="min-h-12 text-base font-extrabold leading-6 text-ink">{step}</p>
              </div>
              {index < processSteps.length - 1 && (
                <ArrowRight className="absolute -right-4 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-bright lg:block" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ImageShowcase({
  onOpen
}: {
  onOpen: (index: number) => void;
}) {
  return (
    <section id="showcase" className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8">
      <div className="absolute inset-x-0 top-0 -z-10 h-72 bg-[linear-gradient(180deg,rgba(238,246,255,0.7),rgba(255,255,255,0))]" />
      <MascotImage
        pose="thumbs"
        className="absolute right-3 top-16 z-0 hidden w-32 drop-shadow-[0_18px_28px_rgba(11,31,77,0.15)] lg:block xl:right-12 xl:w-40"
      />
      <div className="relative z-10 mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="產品展示"
          title="可直接放大的產品畫面示意圖"
        />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {showcaseItems.map((item, index) => (
            <button
              key={item.title}
              onClick={() => onOpen(index)}
              className="group rounded-lg border border-stroke bg-white p-4 text-left shadow-card transition hover:-translate-y-1 hover:border-primary hover:shadow-soft"
            >
              <div className="overflow-hidden rounded-lg border border-stroke bg-mist">
                <img
                  src={asset(item.src)}
                  alt={item.title}
                  className="h-64 w-full object-cover object-top transition duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div className="pt-5">
                <h3 className="text-xl font-extrabold text-ink">{item.title}</h3>
                <p className="mt-2 min-h-14 text-sm leading-7 text-muted">{item.description}</p>
                <span className="mt-4 inline-flex items-center gap-2 rounded-lg bg-mist px-3 py-2 text-sm font-bold text-primary">
                  放大查看
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductDetailSection() {
  return (
    <section className="bg-[linear-gradient(180deg,#ffffff_0%,#eef6ff_100%)] px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
        <article className="rounded-lg border border-stroke bg-white p-6 shadow-card md:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-white">
              <LockKeyhole className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-primary">PC 安裝精靈</p>
              <h2 className="text-2xl font-black text-ink">讓使用者把自己的交易系統安全接上</h2>
            </div>
          </div>
          <p className="text-base leading-8 text-muted">
            使用者提供已申請完成的憑證資料，系統協助完成連線檢查與部署流程。敏感憑證應優先保存在使用者本機或使用者控制的環境，不以網站形式收集真實金鑰。
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {installerItems.map((item) => (
              <div key={item} className="flex items-center gap-2 rounded-lg border border-stroke bg-mist/50 px-3 py-3 text-sm font-bold text-ink">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                {item}
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-lg border border-line bg-white p-4">
            <p className="text-sm leading-7 text-muted">
              示意欄位僅用於產品介紹，不在網站收集 API Key、Secret Key 或憑證密碼。
            </p>
          </div>
        </article>
        <article className="rounded-lg border border-stroke bg-white p-6 shadow-card md:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-white">
              <Bell className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-primary">手機端控制</p>
              <h2 className="text-2xl font-black text-ink">手機打開即可查看策略與遠端操作</h2>
            </div>
          </div>
          <p className="text-base leading-8 text-muted">
            手機端介面保持極簡、低壓與清楚分層。使用者先看到已擁有的策略，再決定是否查看說明或進入預算下單流程。
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {mobileItems.map((item) => (
              <div key={item} className="flex items-center gap-2 rounded-lg border border-stroke bg-mist/50 px-3 py-3 text-sm font-bold text-ink">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                {item}
              </div>
            ))}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-primary p-4 text-white">
              <p className="text-sm text-white/80">模式</p>
              <p className="mt-1 text-xl font-black">模擬 / 實盤</p>
            </div>
            <div className="rounded-lg bg-ink p-4 text-white">
              <p className="text-sm text-white/70">操作</p>
              <p className="mt-1 text-xl font-black">使用者確認</p>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

function ComplianceSection() {
  return (
    <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8">
      <MascotImage
        pose="glasses"
        className="absolute -bottom-10 right-2 z-0 hidden w-36 drop-shadow-[0_18px_28px_rgba(11,31,77,0.14)] md:block lg:right-10 lg:w-44"
      />
      <div className="relative z-10 mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="合規與產品定位"
          title="以使用者規則為核心，安心、可控、合規"
          body="本產品定位為工具 SaaS 與下單輔助流程，協助規則整理與操作確認，不替使用者做投資決策。"
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {complianceCards.map(({ title, text, icon: Icon }) => (
            <article key={title} className="rounded-lg border border-stroke bg-white p-6 shadow-card">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-mist text-primary">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-black text-ink">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-muted">{text}</p>
            </article>
          ))}
        </div>
        <div className="mt-6 rounded-lg border border-line bg-mist p-5 text-center text-sm font-bold leading-7 text-ink">
          本系統為交易規則量化與下單輔助工具，不提供個股投資建議、不保證收益。使用者須自行評估投資風險。
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  return (
    <section id="faq" className="bg-mist/70 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <SectionHeader
          eyebrow="FAQ"
          title="常見問題"
          body="用清楚、低壓的說法回答常見的產品定位與使用邊界。"
        />
        <div className="grid gap-4">
          {faqs.map((faq) => (
            <details key={faq.q} className="group rounded-lg border border-stroke bg-white p-5 shadow-card" open={faq.q === faqs[0].q}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-lg font-extrabold text-ink">
                {faq.q}
                <ChevronRight className="h-5 w-5 shrink-0 text-primary transition group-open:rotate-90" />
              </summary>
              <p className="mt-4 text-base leading-8 text-muted">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section id="contact" className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-lg bg-[linear-gradient(135deg,#0b1f4d_0%,#1266e3_100%)] p-8 text-white shadow-soft md:p-12">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full border border-white/15" />
        <MascotImage
          pose="thumbs"
          className="absolute -bottom-12 right-8 hidden w-36 drop-shadow-[0_20px_32px_rgba(0,0,0,0.22)] xl:block"
        />
        <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center xl:pr-36">
          <div>
            <p className="mb-3 text-sm font-bold text-white/75">下一步</p>
            <h2 className="text-3xl font-black leading-tight md:text-4xl">
              想把交易規則做成真正可展示、可部署、可操作的系統？
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-white/78">
              用專業、可驗證的方式，把交易規則變成可執行的策略與系統。
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <a href="mailto:service@autoquant-trade.com" className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3.5 text-base font-black text-primary">
              預約演示
            </a>
            <a href="mailto:service@autoquant-trade.com" className="inline-flex items-center justify-center rounded-lg border border-white/35 px-6 py-3.5 text-base font-black text-white">
              聯絡洽談
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-ink px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1.3fr_2fr]">
        <div>
          <div className="flex items-center gap-3">
            <LogoMark />
            <div>
              <p className="text-lg font-black">自動量化交易系統</p>
              <p className="mt-1 text-sm text-white/65">把規則變成可量化、可驗證、可執行的流程</p>
            </div>
          </div>
          <p className="mt-5 max-w-md text-sm leading-7 text-white/62">
            專業 SaaS Landing Page，聚焦規則量化、回測展示、安裝部署與手機遠端控制。
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-4">
          {[
            ["產品", "系統特色", "產品展示", "流程說明"],
            ["資源", "教學文件", "常見問題", "更新公告"],
            ["公司", "關於我們", "服務條款", "隱私政策"],
            ["聯絡我們", "service@autoquant-trade.com", "02-1234-5678", "週一至週五 09:00 - 18:00"]
          ].map(([title, ...links]) => (
            <div key={title}>
              <p className="font-black">{title}</p>
              <div className="mt-3 grid gap-2 text-sm text-white/62">
                {links.map((link) => (
                  <span key={link}>{link}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mx-auto mt-10 max-w-7xl border-t border-white/12 pt-6 text-center text-xs text-white/48">
        © 2026 自動量化交易系統. All rights reserved.
      </div>
    </footer>
  );
}

function ImageLightbox({
  item,
  onClose,
  onPrev,
  onNext
}: {
  item: ShowcaseItem;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") onPrev();
      if (event.key === "ArrowRight") onNext();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose, onNext, onPrev]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/78 p-3 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg bg-white shadow-soft"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-stroke p-4">
          <div>
            <h3 className="text-xl font-black text-ink">{item.title}</h3>
            <p className="mt-1 text-sm leading-6 text-muted">{item.description}</p>
          </div>
          <button
            aria-label="關閉放大圖片"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-stroke text-ink hover:bg-mist"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="relative min-h-0 flex-1 overflow-auto bg-mist p-3">
          <img src={asset(item.src)} alt={item.title} className="mx-auto max-h-[72vh] w-auto max-w-full rounded-lg object-contain" />
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-stroke p-3">
          <button
            aria-label="上一張"
            className="inline-flex items-center gap-2 rounded-lg border border-stroke px-4 py-2 text-sm font-bold text-ink hover:bg-mist"
            onClick={onPrev}
          >
            <ChevronLeft className="h-4 w-4" />
            上一張
          </button>
          <button
            aria-label="下一張"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-[#0d56c5]"
            onClick={onNext}
          >
            下一張
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activeItem = useMemo(() => (activeIndex === null ? null : showcaseItems[activeIndex]), [activeIndex]);
  const close = () => setActiveIndex(null);
  const prev = () => setActiveIndex((index) => (index === null ? index : (index - 1 + showcaseItems.length) % showcaseItems.length));
  const next = () => setActiveIndex((index) => (index === null ? index : (index + 1) % showcaseItems.length));

  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <ValueCards />
        <ProcessTimeline />
        <ImageShowcase onOpen={setActiveIndex} />
        <ProductDetailSection />
        <ComplianceSection />
        <FAQSection />
        <FinalCTA />
      </main>
      <Footer />
      {activeItem && <ImageLightbox item={activeItem} onClose={close} onPrev={prev} onNext={next} />}
    </>
  );
}
