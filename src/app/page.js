import Image from "next/image";
import PhishingGame from "./components/PhishingGame";
import { Shield, Terminal, Github } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-cyan-500" />
              <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600">
                融保工(융보공) 피싱 사이트 맞추기
              </span>
            </div>
            <nav className="flex items-center space-x-6">
              <a
                href="https://github.com/yourusername/phishing-defender"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-cyan-500 transition-colors"
              >
                <Github className="h-5 w-5" />
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-grow">
        <PhishingGame />
      </div>

      {/* Footer */}
      {/* <footer className="border-t border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Terminal className="h-5 w-5 text-cyan-500" />
                <h3 className="text-lg font-bold text-cyan-500">融保工(융보공) 피싱 맞추기</h3>
              </div>
              <p className="text-gray-400 text-sm">
                융보공 동아리에서 제작한 피싱 공격을 감지하고 방어하는 기술을 훈련하는 게임입니다.
              </p>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-cyan-500">게임 규칙</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>• 진짜 사이트와 가짜 사이트를 구분하세요</li>
                <li>• 제한 시간 6초 안에 선택하세요</li>
                <li>• 최대한 많은 라운드를 맞혀보세요</li>
                <li>• 제한 시간 내에 아무것도 선택하지 못할 시, -2점이 차감됩니다</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-cyan-500">보안 정보</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>• URL을 주의 깊게 확인하세요</li>
                <li>• 로고와 디자인을 점검하세요</li>
                <li>• 보안 표시를 확인하세요</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-800">
            <p className="text-center text-sm text-gray-500">
              © 2024 融保工(융보공) 동아리. 모든 권리 보유.
            </p>
          </div>
        </div>
      </footer> */}

      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-[-1] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-900 via-gray-950 to-black"></div>
      
      <div className="fixed top-0 left-0 w-full h-screen pointer-events-none z-[-1] opacity-10">
        <div className="absolute inset-0 overflow-hidden">
          <div className="matrix-code-rain">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="code-column" style={{ 
                left: `${i * 5}%`, 
                animationDuration: `${Math.random() * 10 + 5}s`,
                animationDelay: `${Math.random() * 5}s`
              }}>
                {Array.from({ length: 25 }).map((_, j) => (
                  <span key={j} className="code-symbol" style={{
                    animationDelay: `${Math.random() * 2}s`
                  }}>
                    {String.fromCharCode(0x30A0 + Math.random() * 96)}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
