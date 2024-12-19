// app/game/[game-uuid]/page.tsx
"use client";

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export default function GamePage() {
  const pathname = usePathname();
  const gameId = pathname.split('/').pop() || '';
  const [playerId] = useState(() => uuidv4());
  const [round, setRound] = useState<number>(1);
  const [allReady, setAllReady] = useState<boolean>(false);
  const [images, setImages] = useState<string[]>([]);
  const [isReady, setIsReady] = useState<boolean>(false);
  const pollingRef = useRef<NodeJS.Timer | null>(null);

  // ゲーム参加
  useEffect(() => {
    fetch('/api/gameState', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'join', gameId, playerId })
    });
  }, [gameId, playerId]);

  // 全員準備完了確認のポーリング
  useEffect(() => {
    if (isReady && !allReady) {
      pollingRef.current = setInterval(async () => {
        const res = await fetch('/api/gameState', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'status', gameId })
        });
        const data = await res.json();
        setRound(data.round);
        setAllReady(data.allReady);
        setImages(data.images || []);
      }, 1000);
  
      return () => {
        if (pollingRef.current) clearInterval(pollingRef.current as NodeJS.Timeout); // 型アサーションを追加
      };
    }
  }, [isReady, allReady, gameId]);

  const handleReady = async () => {
    const res = await fetch('/api/gameState', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'ready', gameId, playerId })
    });
    const data = await res.json();
    setAllReady(data.allReady);
    setIsReady(true);
  };

  const handleGenerateImage = async () => {
    const res = await fetch('/api/gameState', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'generateImage', gameId })
    });
    const data = await res.json();
    setImages(data.images || []);
  };

  const handleNextRound = async () => {
    const res = await fetch('/api/gameState', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'nextRound', gameId })
    });
    const data = await res.json();
    setRound(data.round);
    setAllReady(false);
    setIsReady(false);
    setImages(data.images || []);
  };

  return (
    <div>
      <h1>Game: {gameId}</h1>
      <h2>Round: {round}</h2>
      {!isReady && (
        <button onClick={handleReady}>準備完了</button>
      )}
      {allReady && (
        <div>
          <p>全員準備完了！ラウンド開始</p>
          {images[round - 1] ? (
            <div>
              <img src={images[round - 1]} alt="Generated" width={256} height={256}/>
              <button onClick={handleNextRound}>次のラウンドへ</button>
            </div>
          ) : (
            <button onClick={handleGenerateImage}>画像生成</button>
          )}
        </div>
      )}
    </div>
  );
}
