export const metadata = {
  title: "使用條款",
  description: "小迷糊密室揪團平台的使用條款與服務協議，使用本平台前請詳閱。",
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsLayout({ children }) {
  // 套用與全站一致的 Header / Footer / RWD 導覽
  // （避免 Terms 頁面有自己的舊版深色系 UI）
  const AppLayout = require('../components/AppLayout').default;
  return <AppLayout>{children}</AppLayout>;
}

