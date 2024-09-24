"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";

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
    return null; // 게임 종료 조건
  }

  const realImage = availableRealImages[Math.floor(Math.random() * availableRealImages.length)];
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
    if (gameStarted && !gameOver) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timer);
            endGame();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameStarted, gameOver]);

  const pickRandomPair = async (images) => {
    const pair = getRandomPair(images, usedImages);
    if (!pair) {
      endGame(); // 모든 이미지를 사용했을 때 게임 종료
      return;
    }
    try {
      await Promise.all(
        pair.map((img) => preloadImage(`/images/${img.filename}`))
      );
      setCurrentPair(pair);
      setUsedImages(prev => [...prev, ...pair.map(img => img.filename)]);
      setTimeLeft(6);
    } catch (err) {
      setError("Failed to load images. Please try again.");
    }
  };
  
  const handleChoice = (chosenImage) => {
    if (chosenImage.isReal) {
      setScore((prevScore) => ({
        ...prevScore,
        correct: prevScore.correct + 1,
      }));
    } else {
      setScore((prevScore) => ({
        ...prevScore,
        incorrect: prevScore.incorrect + 1,
      }));
    }
    pickRandomPair(imageData.images);
  };
  
  const endGame = () => {
    setGameOver(true);
    setGameStarted(false);
  };
  const startGame = () => {
    setScore({ correct: 0, incorrect: 0 });
    setGameOver(false);
    setGameStarted(true);
    setUsedImages([]);
    pickRandomPair(imageData.images);
  };

 

  const restartGame = () => {
    startGame();
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
    return <div className="text-center mt-8">Loading game data...</div>;
  }

  if (error) {
    return <div className="text-center mt-8 text-red-500">Error: {error}</div>;
  }

  if (!gameStarted && !gameOver) {
    return (
      <div className="w-full max-w-4xl mx-auto mt-8 p-4 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center mb-6">피싱 사이트 구별 게임</h1>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">게임 방법</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>두 개의 웹사이트 이미지가 제시됩니다.</li>
            <li>하나는 진짜 사이트, 다른 하나는 가짜(피싱) 사이트입니다.</li>
            <li>제한 시간 6초 안에 진짜 사이트 이미지를 클릭하세요.</li>
          
            <li>최대한 많은 라운드를 맞혀 고득점을 노려보세요!</li>
          </ol>
        </div>
        <div className="text-center">
          <button
            onClick={startGame}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline transition duration-300 ease-in-out transform hover:scale-105"
          >
            게임 시작
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 p-4">
      {gameStarted && !gameOver && (
        <>
          <div
            className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4"
            role="alert"
          >
            <p className="font-bold">남은 시간: {timeLeft}초</p>
            <p>맞춘 개수: {score.correct}</p>
          <p>틀린 개수: {score.incorrect}</p>
          </div>
          {currentPair && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentPair.map((image, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition-transform hover:scale-105"
                  onClick={() => handleChoice(image)}
                >
                  <img
                    src={`/images/${image.filename}`}
                    alt={`${image.siteName} screenshot`}
                    className="w-full h-64 object-contain"
                  />
                  <div className="p-4">
                    <p className="text-xl font-semibold text-center">
                      {image.siteName}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="mt-4 text-center text-lg font-semibold">
            진짜 사이트 이미지를 클릭하세요!
          </p>
        </>
      )}

      {gameOver && (
        <div className="bg-white rounded-lg shadow-md p-6 mt-4">
          <h2 className="text-2xl font-bold mb-4">게임 오버!</h2>
          <p className="mb-2">맞춘 개수: {score.correct}</p>
          <p className="mb-4">틀린 개수: {score.incorrect}</p>
          <div className="mb-4">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              이름
            </label>
            <input
              type="text"
              id="name"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700"
            >
              전화번호
            </label>
            <input
              type="tel"
              id="phone"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="agree"
              className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-offset-0 focus:ring-indigo-200 focus:ring-opacity-50"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <label htmlFor="agree" className="ml-2 block text-sm text-gray-900">
              제출시 랭킹에 등록되며, 전화번호와 이름은 선물 증정 용도 외에 사용되지 않습니다.
            </label>
          </div>
          <div className="flex justify-between">
            <button
              onClick={restartGame}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              다시 시작
            </button>
            <button
              onClick={submitResult}
              disabled={submitting}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
            >
              {submitting ? "제출 중..." : "결과 저장"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}