export const metadata = {
  title: "隱私權政策",
  description: "小迷糊密室揪團平台的隱私權政策，說明我們如何收集、使用和保護您的個人資料。",
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyLayout({ children }) {
  // 套用與全站一致的 Header / Footer / RWD 導覽
  const AppLayout = require('../components/AppLayout').default;
  return <AppLayout>{children}</AppLayout>;
}

