import Image from "next/image";
import PhishingGame from "./components/PhishingGame";

export default function Home() {
  return (
    <div className="container mx-auto px-4">
      <header className="bg-blue-500 text-white p-4 rounded-t-lg mt-8">
        <h1 className="text-3xl font-bold text-center">피싱 사이트를 구별해라!</h1>
        <h3 className="text-3xl font-bold text-center">융보공 일동 제작</h3>
      </header>
      <PhishingGame />
    </div>
  );
}
