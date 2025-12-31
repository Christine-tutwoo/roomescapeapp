import { Inter, Outfit } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});


// NOTE: 預設網域用正式站（避免 Canonical/JSON-LD 指向錯誤網域）
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://xiaomihu-escaperoom.com';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "小迷糊密室揪團平台",
    template: "%s | 小迷糊密室揪團平台",
  },
  // 讓描述長度更貼近 SEO 建議（120+ 字元）
  description:
    "小迷糊是為台灣密室逃脫玩家打造的揪團平台：一鍵開團與報名、即時招募隊友、名額/候補/攜伴管理、場次資訊整理與主揪審核；還有密室玩家人格測驗、許願池與工作室優惠情報，讓你快速找到同好、安心出發不孤單。支援全台地區/工作室/月份/費用篩選與搜尋，並可用分享連結邀請朋友，讓每場密室更快成團。",
  keywords: [
    "密室逃脫",
    "揪團",
    "密室揪團",
    "escape room",
    "密室逃脫揪團",
    "台北密室",
    "密室逃脫推薦",
    "密室玩家",
    "找隊友",
    "實境遊戲",
    "解謎遊戲",
    "小迷糊",
  ],
  authors: [{ name: "小迷糊密室逃脫", url: siteUrl }],
  creator: "小迷糊密室逃脫",
  publisher: "小迷糊密室逃脫",
  icons: {
    icon: [
      { url: '/favicon.ico', type: 'image/x-icon' },
      { url: '/logo.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: '/logo.png',
    shortcut: '/favicon.ico',
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'zh_TW',
    url: siteUrl,
    siteName: '小迷糊密室揪團平台',
    title: '小迷糊密室揪團平台',
    description:
      '小迷糊是為台灣密室逃脫玩家打造的揪團平台：一鍵開團與報名、即時招募隊友、名額/候補/攜伴管理、場次資訊整理與主揪審核；再加上人格測驗、許願池與工作室優惠情報，並支援多條件篩選與分享邀請，揪團更輕鬆。',
    images: [
      {
        // 使用既有檔案，避免 OG 圖檔路徑 404
        url: '/logo.png',
        width: 512,
        height: 512,
        alt: '小迷糊密室逃脫揪團平台',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '小迷糊密室揪團平台',
    description:
      '一鍵開團與報名、即時招募隊友、名額/候補/攜伴管理、場次資訊整理與主揪審核；再加上人格測驗、許願池與工作室優惠情報，支援多條件篩選與分享邀請，讓你快速找到同好、安心出發不孤單。',
    images: ['/logo.png'],
    creator: '@xiaomihu_escape',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  alternates: {
    canonical: siteUrl,
  },
  category: 'entertainment',
};

// JSON-LD 結構化數據
const logoUrl = `${siteUrl}/logo.png`;
const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: '小迷糊密室揪團平台',
    description:
      '小迷糊是為台灣密室逃脫玩家打造的揪團平台：一鍵開團與報名、即時招募隊友、名額/候補/攜伴管理、場次資訊整理與主揪審核；還有密室玩家人格測驗、許願池與工作室優惠情報，並支援多條件篩選與分享邀請，讓你快速找到同好、安心出發不孤單。',
    url: siteUrl,
    image: logoUrl,
    applicationCategory: 'Entertainment',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'TWD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '150',
    },
    author: {
      '@type': 'Organization',
      name: '小迷糊密室逃脫',
      url: 'https://www.instagram.com/hu._escaperoom',
      logo: {
        '@type': 'ImageObject',
        url: logoUrl,
        width: 512,
        height: 512,
      },
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: '小迷糊密室逃脫',
    url: siteUrl,
    logo: {
      '@type': 'ImageObject',
      url: logoUrl,
      width: 512,
      height: 512,
    },
    image: logoUrl,
    sameAs: [
      'https://www.instagram.com/hu._escaperoom',
      'https://linktr.ee/hu._escaperoom',
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: '小迷糊密室揪團平台',
    url: siteUrl,
    publisher: {
      '@type': 'Organization',
      name: '小迷糊密室逃脫',
      logo: {
        '@type': 'ImageObject',
        url: logoUrl,
        width: 512,
        height: 512,
      },
    },
  },
];

export default function RootLayout({ children }) {
  return (
    <html lang="zh-TW">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${inter.variable} ${outfit.variable} antialiased`}
      >
        {children}

        {/* Google Analytics 4 */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}');
          `}
        </Script>
      </body>
    </html>
  );
}
