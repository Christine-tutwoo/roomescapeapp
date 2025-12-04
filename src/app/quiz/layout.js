export const metadata = {
  title: "2025 密室玩家人格測驗",
  description: "10 道情境題，揭曉你在密室裡的真實面貌！你是破陣坦克、解謎大腦、鷹眼搜查官、極致倉鼠、佛系吉祥物，還是傳說中的六邊形戰士？快來測測看！",
  keywords: [
    "密室人格測驗",
    "密室逃脫測驗",
    "密室玩家類型",
    "escape room personality",
    "密室性格測試",
    "2025 密室測驗",
  ],
  openGraph: {
    title: "🎮 2025 密室玩家人格測驗 | 你是哪種密室玩家？",
    description: "10 道情境題，揭曉你在密室裡的真實面貌！測測你是破陣坦克、解謎大腦還是六邊形戰士？",
    type: 'website',
    images: [
      {
        url: '/og-quiz.png',
        width: 1200,
        height: 630,
        alt: '2025 密室玩家人格測驗',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '🎮 2025 密室玩家人格測驗',
    description: '10 道情境題，測測你是哪種密室玩家！',
    images: ['/og-quiz.png'],
  },
};

// Quiz 頁面專用 JSON-LD
const quizJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Quiz',
  name: '2025 密室玩家人格測驗',
  description: '10 道情境題，揭曉你在密室裡的真實面貌！',
  educationalLevel: 'beginner',
  numberOfQuestions: 10,
  timeRequired: 'PT3M',
  about: {
    '@type': 'Thing',
    name: '密室逃脫人格類型',
  },
  provider: {
    '@type': 'Organization',
    name: '小迷糊密室逃脫',
    url: 'https://xiaomihu.tw',
  },
};

export default function QuizLayout({ children }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(quizJsonLd) }}
      />
      {children}
    </>
  );
}

