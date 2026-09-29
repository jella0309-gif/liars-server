import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { emitPlayAgain } from '../socket';
import { CharacterPortrait } from './CharacterPortrait';
import { Dialog } from './Dialog';
import { Icon } from './Icon';
export const WinnerOverlay: React.FC = () => {
  const {
    winnerName,
    winnerSeatIndex,
    currentRoomId,
    gameState,
    playersInfo,
    isConnected,
  } = useGameStore();
  const [pending, setPending] = useState(false);
  React.useEffect(() => {
    setPending(false);
  }, [winnerName, isConnected]);
  React.useEffect(() => {
    if (pending) {
      const timer = setTimeout(() => setPending(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [pending]);
  if (!winnerName) return null;
  const player =
    gameState?.me.seatIndex === winnerSeatIndex
      ? gameState.me
      : gameState?.opponents.find((p) => p.seatIndex === winnerSeatIndex);
  const avatar =
    player?.avatar ||
    playersInfo.find((p) => p.seatIndex === winnerSeatIndex)?.avatar ||
    '🐵';
  return (
    <Dialog className="winner-dialog" label="Kết quả trận đấu">
      <div className="winner-art">
        <CharacterPortrait avatar={avatar} mood="win" />
        <span className="winner-crown">
          <Icon name="crown" size={32} />
        </span>
      </div>
      <span className="eyebrow">THE LAST ONE STANDING</span>
      <h2>{winnerName}</h2>
      <div className="winner-caption">KẺ SỐNG SÓT CUỐI CÙNG.</div>
      <p>
        Bài đã hạ. Vận may vẫn còn.
        <br />
        Đêm nay, chiếc ghế này thuộc về bạn.
      </p>
      <button
        className="btn-primary"
        disabled={!isConnected || pending}
        onClick={() => {
          setPending(true);
          emitPlayAgain(currentRoomId);
        }}
      >
        {pending ? 'ĐANG CHUẨN BỊ…' : 'THÊM MỘT TRẬN'}
        <Icon name="arrow" />
      </button>
      <button className="text-button" onClick={() => location.reload()}>
        Trở về sảnh
      </button>
    </Dialog>
  );
};
