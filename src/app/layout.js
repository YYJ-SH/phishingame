import "./globals.css";

export const metadata = {
  title: "피싱 디펜더",
  description: "피싱 공격을 감지하고 방어하는 기술을 훈련하세요",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className="font-dunggeunmo">{children}</body>
    </html>
  );
}
