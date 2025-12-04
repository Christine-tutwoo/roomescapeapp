import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://xiaomihu.tw';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "小迷糊密室逃脫揪團平台 | 找密室玩家一起逃脫",
    template: "%s | 小迷糊密室逃脫揪團",
  },
  description: "台灣最懂密室玩家的揪團神器！快速找到志同道合的密室夥伴，一起挑戰各種主題密室逃脫。支援即時揪團、人格測驗、活動管理，讓每次密室體驗都不孤單。",
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
    icon: '/logo.png',
    apple: '/logo.png',
    shortcut: '/logo.png',
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'zh_TW',
    url: siteUrl,
    siteName: '小迷糊密室逃脫揪團平台',
    title: '小迷糊密室逃脫揪團平台 | 找密室玩家一起逃脫',
    description: '台灣最懂密室玩家的揪團神器！快速找到志同道合的密室夥伴，一起挑戰各種主題密室逃脫。',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: '小迷糊密室逃脫揪團平台',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '小迷糊密室逃脫揪團平台 | 找密室玩家一起逃脫',
    description: '台灣最懂密室玩家的揪團神器！快速找到志同道合的密室夥伴。',
    images: ['/og-image.png'],
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
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '小迷糊密室逃脫揪團平台',
  description: '台灣最懂密室玩家的揪團神器！快速找到志同道合的密室夥伴，一起挑戰各種主題密室逃脫。',
  url: 'https://xiaomihu.tw',
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
  },
};

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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
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
