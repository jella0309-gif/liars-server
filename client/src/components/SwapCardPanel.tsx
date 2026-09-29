import React, { useState, useEffect, useRef } from 'react';
import { PlayingCard } from './PlayingCard';
import { useGameStore } from '../store/gameStore';
import { emitSwapConfirm } from '../socket';
import { useTurnClock } from '../hooks/useTurnClock';
import { TIMING } from '@liars-bar/shared';
import { Dialog } from './Dialog';
import { Icon } from './Icon';
export const SwapCardPanel: React.FC = () => {
  const { swapPoolCards, setSwapPool, gameState, currentRoomId, isConnected } =
    useGameStore();
  const turnSeconds = useTurnClock();
  const [handIndex, setHandIndex] = useState<number | null>(null),
    [drawnIndex, setDrawnIndex] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(
    TIMING.SWAP_TIME_LIMIT
  );
  const [swapping, setSwapping] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (!swapPoolCards) return;
    setHandIndex(null);
    setDrawnIndex(null);
    setSwapping(false);
    const deadline = Date.now() + TIMING.SWAP_TIME_LIMIT * 1000;
    setSecondsLeft(TIMING.SWAP_TIME_LIMIT);
    const timer = setInterval(
      () =>
        setSecondsLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000))),
      250
    );
    return () => {
      clearInterval(timer);
      clearTimeout(confirmTimer.current);
    };
  }, [swapPoolCards]);
  const remaining = Math.min(secondsLeft, turnSeconds);
  useEffect(() => {
    if (swapPoolCards && remaining <= 0) setSwapPool(null);
  }, [remaining, swapPoolCards, setSwapPool]);
  if (!swapPoolCards) return null;
  const confirm = () => {
    if (handIndex === null || drawnIndex === null || swapping || !isConnected)
      return;
    setSwapping(true);
    // The short exchange finishes before submission; no successful result is invented locally.
    confirmTimer.current = setTimeout(() => {
      emitSwapConfirm(currentRoomId, handIndex, drawnIndex);
      setSwapPool(null);
    }, 450);
  };
  const close = () => {
    if (!swapping) setSwapPool(null);
  };
  return (
    <Dialog
      label="Đổi một lá bài"
      className={`swap-dialog ${swapping ? 'is-swapping' : ''}`}
      onClose={close}
    >
      <button
        className="dialog-close icon-button"
        disabled={swapping}
        aria-label="Giữ bài và đóng"
        onClick={close}
      >
        <Icon name="close" />
      </button>
      <span className="eyebrow">MỘT LẦN ĐỔI VẬN</span>
      <h2>
        Thay lá bài.
        <br />
        <em>Đổi số phận.</em>
      </h2>
      <div className="swap-intro">
        <p>
          Chọn một lá bỏ đi và một lá nhận về.
          <br />
          Sau khi đổi, bạn vẫn cần chọn hành động.
        </p>
        <span className={`swap-timer ${remaining <= 5 ? 'urgent' : ''}`}>
          <Icon name="clock" size={16} />
          {remaining}s
        </span>
      </div>
      <div className="swap-zone swap-hand">
        <div className="section-heading">
          <h3>
            <span>01</span> LÁ BẠN MUỐN BỎ
          </h3>
          <span>{handIndex !== null ? 'ĐÃ CHỌN 1 LÁ' : 'CHỌN 1 LÁ'}</span>
        </div>
        <div className="swap-cards-row">
          {gameState?.me.cards.map((c, i) => (
            <PlayingCard
              key={i}
              card={c}
              selectable={!swapping}
              selected={handIndex === i}
              onClick={() => setHandIndex(i)}
            />
          ))}
        </div>
      </div>
      <div className="swap-divider">
        <span />
        <Icon name="swap" />
        <span />
      </div>
      <div className="swap-zone swap-draw">
        <div className="section-heading">
          <h3>
            <span>02</span> LÁ BẠN NHẬN VỀ
          </h3>
          <span>{drawnIndex !== null ? 'ĐÃ CHỌN 1 LÁ' : 'CHỌN 1 LÁ'}</span>
        </div>
        <div className="swap-cards-row">
          {swapPoolCards.map((c, i) => (
            <PlayingCard
              key={i}
              card={c}
              selectable={!swapping}
              selected={drawnIndex === i}
              onClick={() => setDrawnIndex(i)}
              delay={i * 90}
            />
          ))}
        </div>
      </div>
      <button
        className="btn-primary"
        disabled={
          handIndex === null ||
          drawnIndex === null ||
          swapping ||
          !isConnected ||
          remaining < 1
        }
        onClick={confirm}
      >
        {swapping ? 'ĐANG ĐỔI BÀI…' : 'XÁC NHẬN ĐỔI BÀI'}
        <Icon name="swap" />
      </button>
      <button className="text-button" disabled={swapping} onClick={close}>
        Giữ bài hiện tại
      </button>
    </Dialog>
  );
};
