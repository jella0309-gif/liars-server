import React from 'react';
import { useGameStore } from '../store/gameStore';
import { emitAction, emitSwapRequest, emitNextRound, emitPlayAgain } from '../socket';
import { unlockAudioContext } from '../utils/audio';

export const PlayerControls: React.FC = () => {
  const gameState = useGameStore((state) => state.gameState);
  const mySeatIndex = useGameStore((state) => state.mySeatIndex);
  const currentRoomId = useGameStore((state) => state.currentRoomId);
  const isRoundOver = useGameStore((state) => state.isRoundOver);
  const roundOverMessage = useGameStore((state) => state.roundOverMessage);
  const winnerName = useGameStore((state) => state.winnerName);
  const showdownResults = useGameStore((state) => state.showdownResults);
  const rouletteResult = useGameStore((state) => state.rouletteResult);

  const me = gameState?.me;
  const isProcessingRoulette = gameState?.isProcessingRoulette || !!rouletteResult;
  const isShowdown = !!showdownResults;
  const isMyTurn = gameState?.currentTurnSeat === mySeatIndex && !isProcessingRoulette && !isRoundOver && !winnerName && !isShowdown;
  const hasAnyAllIn = gameState?.hasAnyAllIn || false;
  const canSwap = gameState?.canSwap || false;

  const currentTurnSeat = gameState?.currentTurnSeat;
  const currentTurnPlayerName = currentTurnSeat !== undefined && currentTurnSeat !== -1
    ? (currentTurnSeat === mySeatIndex ? (me?.name || 'Bạn') : (gameState?.opponents.find(o => o.seatIndex === currentTurnSeat)?.name || `Ghế #${currentTurnSeat + 1}`))
    : 'Đối thủ';

  const myBullets = me?.isAllIn ? 6 : (me?.bullets || 1);
  const nextBullet = Math.min(6, myBullets + 1);
  const nextOdds = Math.round((nextBullet / 6) * 100);

  const handleAction = (action: 'fold' | 'call' | 'allin') => {
    unlockAudioContext();
    emitAction(currentRoomId, action);
  };

  const handleRequestSwap = () => {
    unlockAudioContext();
    emitSwapRequest(currentRoomId);
  };

  const handleNextRound = () => {
    unlockAudioContext();
    emitNextRound(currentRoomId);
  };

  const handlePlayAgain = () => {
    unlockAudioContext();
    emitPlayAgain(currentRoomId);
  };

  // 1. MATCH OVER STATE
  if (winnerName) {
    return (
      <div className="player-controls-container">
        <div className="player-controls match-over-bar">
          <div className="status-announcement">
            <div className="announcement-title">🏆 TRẬN ĐẤU KẾT THÚC</div>
            <div className="announcement-sub">
              <strong>{winnerName.toUpperCase()}</strong> là người sống sót duy nhất!
            </div>
          </div>
          <button
            type="button"
            className="btn-next-round btn-play-again pulse"
            onClick={handlePlayAgain}
          >
            🔄 CHƠI LẠI TRẬN MỚI
          </button>
        </div>
      </div>
    );
  }

  // 2. ROUND OVER STATE (Do not auto-restart, player controlled!)
  if (isRoundOver) {
    return (
      <div className="player-controls-container">
        <div className="player-controls round-over-bar">
          <div className="status-announcement">
            <div className="announcement-title">🏁 VÁN ĐẤU ĐÃ KẾT THÚC</div>
            <div className="announcement-sub">
              {roundOverMessage || 'Tất cả đã hoàn thành bóp cò. Hãy bấm nút để bắt đầu ván tiếp theo!'}
            </div>
          </div>
          <button
            type="button"
            className="btn-next-round pulse"
            onClick={handleNextRound}
          >
            ▶ TIẾP TỤC VÁN TIẾP THEO
          </button>
        </div>
      </div>
    );
  }

  // 3. SHOWDOWN OR ROULETTE RESOLVING STATE
  if (isShowdown || isProcessingRoulette) {
    return (
      <div className="player-controls-container">
        <div className="player-controls resolving-bar">
          <div className="resolving-indicator">
            <span className="spinner-dot"></span>
            {rouletteResult ? (
              <span>☠ <strong>RUSSIAN ROULETTE:</strong> {rouletteResult.name} đang bóp cò revolver...</span>
            ) : (
              <span>👀 <strong>SHOWDOWN:</strong> Đang công khai bài của tất cả người chơi...</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 4. PLAYER DEAD OR FOLDED STATE
  if (me?.isDead) {
    return (
      <div className="player-controls-container">
        <div className="player-controls dead-bar">
          <span className="dead-tag">☠ BẠN ĐÃ BỊ LOẠI KHỎI TRẬN ĐẤU (ĐANG THEO DÕI)</span>
        </div>
      </div>
    );
  }

  if (me?.folded) {
    return (
      <div className="player-controls-container">
        <div className="player-controls folded-bar">
          <span className="folded-tag">🏳 BẠN ĐÃ BỎ BÀI Ở VÁN NÀY (ĐÃ BÓP CÒ ROULETTE AN TOÀN)</span>
        </div>
      </div>
    );
  }

  // 5. ACTIVE TURN GAMEPLAY CONTROLS
  const isControlsDisabled = !isMyTurn;

  return (
    <div className="player-controls-container">
      {/* Turn Status Banner */}
      <div className={`turn-banner ${isMyTurn ? 'my-turn-banner' : 'opp-turn-banner'}`}>
        {isMyTurn ? (
          <span>👉 <strong>LƯỢT CỦA BẠN!</strong> Chọn hành động bên dưới (Thời gian: 30s)</span>
        ) : (
          <span>⏳ Đang chờ <strong>{currentTurnPlayerName}</strong> suy nghĩ và ra quyết định...</span>
        )}
      </div>

      <div className="player-controls">
        {/* FOLD BUTTON */}
        <button
          type="button"
          className="btn-act btn-fold"
          disabled={isControlsDisabled}
          onClick={() => handleAction('fold')}
        >
          BỎ BÀI (FOLD)
          <span className="sub">Chấp nhận bóp cò</span>
        </button>

        {/* CALL BUTTON */}
        {!hasAnyAllIn && (
          <button
            type="button"
            className="btn-act btn-call"
            disabled={isControlsDisabled}
            onClick={() => handleAction('call')}
          >
            THEO (+1 VIÊN)
            <span className="sub">
              Lên {nextBullet} viên ({nextOdds}% nổ)
            </span>
          </button>
        )}

        {/* SWAP CARD BUTTON */}
        {!hasAnyAllIn && canSwap && (
          <button
            type="button"
            className="btn-act btn-swap"
            disabled={isControlsDisabled}
            onClick={handleRequestSwap}
          >
            🔄 ĐỔI BÀI
            <span className="sub">1 lần duy nhất</span>
          </button>
        )}

        {/* ALL-IN BUTTON */}
        {hasAnyAllIn ? (
          <button
            type="button"
            className="btn-act btn-allin"
            disabled={isControlsDisabled}
            onClick={() => handleAction('allin')}
          >
            ALL-IN (6 VIÊN)
            <span className="sub">Bắt buộc All-in theo!</span>
          </button>
        ) : gameState?.stage && gameState.stage > 0 ? (
          <button
            type="button"
            className="btn-act btn-allin"
            disabled={isControlsDisabled}
            onClick={() => handleAction('allin')}
          >
            ALL-IN (6 VIÊN)
            <span className="sub">100% buồng có đạn</span>
          </button>
        ) : null}
      </div>
    </div>
  );
};
