"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Shield, 
  Terminal, 
  Clock, 
  Trophy, 
  Eye, 
  EyeOff, 
  Timer,
  Maximize2,
  MinusCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Import shadcn components
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

// Helper functions
const parseImageInfo = (filename) => {
  const [type, siteName, difficulty] = filename.replace(".jpg", "").split("_");
  return {
    filename,
    siteName: siteName.charAt(0).toUpperCase() + siteName.slice(1),
    isReal: type === "real",
    difficulty,
  };
};

const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const getRandomPair = (images, usedImages) => {
  const availableRealImages = images.filter(img => img.startsWith("real_") && !usedImages.includes(img));
  const availableFakeImages = images.filter(img => img.startsWith("fake_") && !usedImages.includes(img));
  
  if (availableRealImages.length === 0 || availableFakeImages.length === 0) {
    return null; // Game end condition
  }

  const realImage = availableRealImages[Math.floor(Math.random() * availableRealImages.length)];
  // Find matching fake image with same site name
  const fakeImage = availableFakeImages.find(img => img.includes(realImage.split("_")[1]));

  return shuffleArray([parseImageInfo(realImage), parseImageInfo(fakeImage)]);
};

const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = resolve;
    img.onerror = reject;
    img.src = src;
  });
};

// Difficulty badges
const DifficultyBadge = ({ difficulty }) => {
  const getBadgeColor = () => {
    switch (difficulty) {
      case "easy":
        return "bg-green-500";
      case "medium":
        return "bg-yellow-500";
      case "hard":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <Badge className={`${getBadgeColor()} text-white`}>
      {difficulty.toUpperCase()}
    </Badge>
  );
};

// Terminal effect component
const TerminalText = ({ text }) => {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(currentIndex + 1);
      }, 20);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text]);

  return (
    <div className="font-mono text-green-500">
      {displayText}<span className="animate-pulse">_</span>
    </div>
  );
};

// Main component
export default function PhishingGame() {
  const [imageData, setImageData] = useState(null);
  const [currentPair, setCurrentPair] = useState(null);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [timeLeft, setTimeLeft] = useState(6);
  const [gameOver, setGameOver] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [usedImages, setUsedImages] = useState([]);
  const [fullscreen, setFullscreen] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [countdownActive, setCountdownActive] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    const loadImageData = async () => {
      try {
        const response = await fetch("/imageData.json");
        if (!response.ok) {
          throw new Error("Failed to load image data");
        }
        const data = await response.json();
        setImageData(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    loadImageData();
  }, []);

  useEffect(() => {
    let timer;
    if (gameStarted && !gameOver && currentPair) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timer);
            // Find the real image from the current pair
            const realImage = currentPair.find(img => img.isReal);
            setLastResult({ correct: false, selected: null, real: realImage });
            setScore((prevScore) => ({
              ...prevScore,
              incorrect: prevScore.incorrect + 1,
            }));
            setTimeout(() => {
              setLastResult(null);
              pickRandomPair(imageData.images);
            }, 1000);
            return 6;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [gameStarted, gameOver, currentPair, imageData]);

  useEffect(() => {
    let countdownTimer;
    if (countdownActive) {
      countdownTimer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownTimer);
            setCountdownActive(false);
            setGameStarted(true);
            pickRandomPair(imageData.images);
            return 3;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(countdownTimer);
  }, [countdownActive, imageData]);

  const pickRandomPair = async (images) => {
    setImageLoading(true);
    const pair = getRandomPair(images, usedImages);
    if (!pair) {
      endGame(); // End game when all images used
      return;
    }
    try {
      await Promise.all(
        pair.map((img) => preloadImage(`/images/${img.filename}`))
      );
      setCurrentPair(pair);
      setUsedImages(prev => [...prev, ...pair.map(img => img.filename)]);
      setTimeLeft(6);
      setImageLoading(false);
    } catch (err) {
      setError("Failed to load images. Please try again.");
      setImageLoading(false);
    }
  };
  
  const handleChoice = (chosenImage) => {
    // Find the real image from the pair
    const realImage = currentPair.find(img => img.isReal);
    
    if (chosenImage.isReal) {
      setScore((prevScore) => ({
        ...prevScore,
        correct: prevScore.correct + 1,
      }));
      setLastResult({ correct: true, selected: chosenImage, real: realImage });
    } else {
      setScore((prevScore) => ({
        ...prevScore,
        incorrect: prevScore.incorrect + 1,
      }));
      setLastResult({ correct: false, selected: chosenImage, real: realImage });
    }
    
    setTimeout(() => {
      setLastResult(null);
      pickRandomPair(imageData.images);
    }, 1000);
  };
  
  const endGame = () => {
    setGameOver(true);
    setGameStarted(false);
    setCountdownActive(false);
  };
  
  const startGameCountdown = () => {
    setScore({ correct: 0, incorrect: 0 });
    setGameOver(false);
    setLastResult(null);
    setUsedImages([]);
    setCountdownActive(true);
  };

  const restartGame = () => {
    startGameCountdown();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(e => {
        console.error(`Error attempting to enable fullscreen: ${e.message}`);
      });
      setFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setFullscreen(false);
      }
    }
  };

  const submitResult = async () => {
    if (!name || !phone || !agreed) {
      alert("이름과 전화번호를 입력하고 동의해주세요.");
      return;
    }

    setSubmitting(true);

    const botToken = "6228874913:AAF7pRTgVJQIFPEgTb60lx6Kq0NKOtEH23I";
    const chatId = "5687880513";

    const message = `새로운 게임 결과:\n이름: ${name}\n전화번호: ${phone}\n점수: ${score.correct}`;

    try {
      await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        chat_id: chatId,
        text: message,
      });

      alert("결과가 성공적으로 제출되었습니다.");
      setName("");
      setPhone("");
      setAgreed(false);
    } catch (error) {
      console.error("텔레그램 메시지 전송 실패:", error);
      alert("결과 제출에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="animate-pulse flex flex-col items-center">
          <Terminal className="h-16 w-16 text-cyan-500 mb-4" />
          <h2 className="text-2xl font-mono mb-2">초기화 중</h2>
          <div className="w-64 h-2 bg-gray-200 rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-green-500 rounded-full animate-[loading_1.5s_ease-in-out_infinite]"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-md mx-auto mt-8">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>오류</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (countdownActive) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="font-mono text-green-500 mb-4">시작까지</div>
          <div className="text-8xl font-bold text-white bg-green-600 w-32 h-32 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-300/30">
            {countdown}
          </div>
          <p className="mt-8 font-mono text-gray-600">피싱 사이트 식별 훈련을 준비하세요</p>
        </div>
      </div>
    );
  }

  if (!gameStarted && !gameOver) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="border-2 border-gray-800 bg-gray-900 text-white shadow-lg shadow-cyan-500/10">
          <CardHeader className="border-b border-gray-800">
            <div className="flex items-center justify-center mb-4">
              <CardTitle className="text-3xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600">
              融保工(융보공) 피싱 맞추기
              </CardTitle>
            </div>
            <CardDescription className="text-gray-400 text-center">
              <TerminalText text="피싱 공격을 감지하고 방어하는 기술을 훈련하세요_" />
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs defaultValue="instructions" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-800">
                <TabsTrigger value="instructions" className="data-[state=active]:bg-cyan-900">미션 설명</TabsTrigger>
                <TabsTrigger value="tips" className="data-[state=active]:bg-cyan-900">보안 정보</TabsTrigger>
              </TabsList>
              <TabsContent value="instructions" className="bg-gray-800 p-4 rounded-md mt-2">
                <h3 className="text-xl font-semibold font-mono text-cyan-500 mb-3">게임 규칙</h3>
                <ol className="space-y-4">
                  <li className="flex items-start">
                    <div className="bg-cyan-600 rounded-full p-1 mr-3 mt-1">
                      <span className="text-sm">1</span>
                    </div>
                    <span>두 개의 웹사이트 이미지가 제시됩니다. 하나는 진짜 사이트, 다른 하나는 가짜(피싱) 사이트입니다.</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-cyan-600 rounded-full p-1 mr-3 mt-1">
                      <span className="text-sm">2</span>
                    </div>
                    <span>제한 시간 6초 안에 <span className="text-green-400 font-bold">진짜 사이트</span> 이미지를 선택하세요.</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-cyan-600 rounded-full p-1 mr-3 mt-1">
                      <span className="text-sm">3</span>
                    </div>
                    <span>제한 시간 6초 안에 아무것도 누르지 않을 시 <span className="text-red-400 font-bold"> -2점이</span> 감점됩니다.</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-cyan-600 rounded-full p-1 mr-3 mt-1">
                      <span className="text-sm">4</span>
                    </div>
                    <span>최대한 많은 라운드를 맞혀 고득점을 노려보세요!</span>
                  </li>
                </ol>
              </TabsContent>
              <TabsContent value="tips" className="bg-gray-800 p-4 rounded-md mt-2">
                <h3 className="text-xl font-semibold font-mono text-cyan-500 mb-3">보안 정보</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>URL을 주의 깊게 확인하세요. 철자 오류나 이상한 도메인은 피싱의 징후입니다.</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>로고와 디자인이 약간 다르거나 해상도가 낮은 경우 가짜일 수 있습니다.</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>보안 표시(자물쇠 아이콘)가 없는 경우 주의하세요.</span>
                  </li>
                </ul>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-4 justify-between border-t border-gray-800 pt-4">
            <Button 
              variant="default" 
              className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-none font-mono"
              onClick={startGameCountdown}
            >
              <Terminal className="mr-2 h-4 w-4" /> 게임 시작
            </Button>
            <Button 
              variant="outline" 
              className="w-full sm:w-auto border-cyan-500 text-cyan-500 hover:bg-cyan-500/10 font-mono"
              onClick={toggleFullscreen}
            >
              <Maximize2 className="mr-2 h-4 w-4" /> 전체화면
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 max-w-5xl">
      {gameStarted && !gameOver && (
        <>
          <div className="flex flex-col lg:flex-row justify-between gap-4 mb-6">
            <Card className="w-full lg:w-1/3 border-gray-800 bg-gray-900 text-white">
              <CardHeader className="py-3">
                <CardTitle className="flex justify-between items-center text-lg font-mono">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-red-500 mr-2" />
                    남은 시간
                  </div>
                  <span className={`${timeLeft <= 2 ? 'text-red-500 animate-pulse' : 'text-cyan-500'}`}>{timeLeft}초</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="py-1">
                <Progress value={(timeLeft / 6) * 100} className="h-2 bg-gray-800" indicatorClassName="bg-cyan-500" />
              </CardContent>
            </Card>
            
            <Card className="w-full lg:w-2/3 border-gray-800 bg-gray-900 text-white">
              <CardHeader className="py-3">
                <CardTitle className="flex justify-between items-center text-lg font-mono">
                  <div className="flex items-center">
                    <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
                    점수 현황
                  </div>
                  <div className="flex gap-4">
                    <span className="text-green-500">
                      <CheckCircle2 className="h-5 w-5 inline mr-1" />
                      {score.correct}
                    </span>
                    <span className="text-red-500">
                      <XCircle className="h-5 w-5 inline mr-1" />
                      {score.incorrect}
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="py-1">
                <Progress 
                  value={score.correct > 0 || score.incorrect > 0 ? 
                    (score.correct / (score.correct + score.incorrect) * 100) : 0} 
                  className="h-2 bg-gray-800" 
                  indicatorClassName="bg-green-500" 
                />
              </CardContent>
            </Card>
          </div>

          <div className="mb-4 text-center">
            <Alert className="bg-cyan-900/40 border-cyan-500 text-white">
              <Terminal className="h-5 w-5 text-cyan-500" />
              <AlertTitle className="font-mono text-cyan-500">미션 목표</AlertTitle>
              <AlertDescription>진짜 사이트 이미지를 선택하세요!</AlertDescription>
            </Alert>
          </div>

          {currentPair && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentPair.map((image, index) => (
                <AnimatePresence key={image.filename}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className={`relative rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:shadow-cyan-500/20 border-2 ${
                      lastResult?.selected?.filename === image.filename 
                        ? lastResult.correct 
                          ? 'border-green-500 bg-green-500/10' 
                          : 'border-red-500 bg-red-500/10'
                        : 'border-gray-800 bg-gray-900'
                    }`}
                    onClick={() => handleChoice(image)}
                  >
                    <div className="absolute top-2 right-2 z-10 flex gap-1">
                      <Badge className="bg-gray-800 text-white font-mono">
                        {image.siteName}
                      </Badge>
                      <DifficultyBadge difficulty={image.difficulty} />
                    </div>

                    {imageLoading ? (
                      <div className="w-full h-64 md:h-80 flex items-center justify-center bg-gray-800">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500"></div>
                      </div>
                    ) : (
                      <div className="relative group">
                        <img
                          src={`/images/${image.filename}`}
                          alt={`${image.siteName} screenshot`}
                          className="w-full h-64 md:h-80 object-contain bg-white"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-0 group-hover:opacity-30 transition-opacity"></div>
                        
                        <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <Button variant="secondary" size="sm" className="bg-gray-800 text-white">
                                <Eye className="h-4 w-4 mr-1" /> 세부 확인
                              </Button>
                            </HoverCardTrigger>
                            <HoverCardContent className="bg-black/90 border-cyan-500 text-white p-2 text-xs w-64">
                              <strong className="text-cyan-500">보안 점검:</strong>
                              <ul className="mt-2 space-y-1">
                                <li>• URL을 확인하세요</li>
                                <li>• 로고와 디자인 품질을 점검하세요</li>
                                <li>• 보안 표시(자물쇠)가 있나요?</li>
                                <li>• 의심스러운 문구가 있나요?</li>
                              </ul>
                            </HoverCardContent>
                          </HoverCard>
                        </div>

                        {lastResult && lastResult.real.filename === image.filename && (
                          <div className="absolute inset-0 flex items-center justify-center bg-green-500/20">
                            <Badge className="bg-green-500 text-white py-1 px-3">
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              진짜 사이트
                            </Badge>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              ))}
            </div>
          )}
        </>
      )}

      {gameOver && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl mx-auto"
        >
          <Card className="border-2 border-gray-800 bg-gray-900 text-white shadow-lg">
            <CardHeader className="border-b border-gray-800">
              <CardTitle className="flex items-center justify-center text-2xl font-mono text-cyan-500">
                <Terminal className="mr-2 h-6 w-6" />
                미션 완료
              </CardTitle>
              <CardDescription className="text-gray-400 text-center">
                <TerminalText text="훈련 결과를 확인하세요" />
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-800 p-4 rounded-lg flex flex-col items-center">
                  <CheckCircle2 className="h-10 w-10 text-green-500 mb-2" />
                  <div className="text-lg text-green-500 font-medium">정확한 식별</div>
                  <div className="text-3xl font-bold font-mono">{score.correct}</div>
                </div>
                
                <div className="bg-gray-800 p-4 rounded-lg flex flex-col items-center">
                  <XCircle className="h-10 w-10 text-red-500 mb-2" />
                  <div className="text-lg text-red-500 font-medium">잘못된 식별</div>
                  <div className="text-3xl font-bold font-mono">{score.incorrect}</div>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-center border-t border-gray-800 pt-4">
              <Button
                onClick={restartGame}
                className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-700 text-white font-mono"
              >
                <Timer className="mr-2 h-4 w-4" /> 
                재도전
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      )}
      
      {/* Cybersecurity theme elements */}
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
      
      <style jsx>{`
        @keyframes fall {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        
        @keyframes flicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @keyframes loading {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        
        .matrix-code-rain {
          position: absolute;
          top: 0;
          width: 100%;
          height: 100%;
        }
        
        .code-column {
          position: absolute;
          top: -100%;
          display: flex;
          flex-direction: column;
          animation: fall linear infinite;
          color: #0f0;
          font-family: monospace;
          font-size: 14px;
          width: 1em;
        }
        
        .code-symbol {
          animation: flicker 3s linear infinite;
        }
      `}</style>
    </div>
  );
}