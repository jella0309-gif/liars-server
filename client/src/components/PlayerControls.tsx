import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { emitAction, emitSwapRequest, emitNextRound } from '../socket';
import { useTurnClock } from '../hooks/useTurnClock';
import { Icon } from './Icon';
export const PlayerControls: React.FC = () => {
  const {
    gameState,
    mySeatIndex,
    currentRoomId,
    isRoundOver,
    winnerName,
    showdownResults,
    rouletteResult,
    isConnected,
    swapPoolCards,
  } = useGameStore();
  const seconds = useTurnClock();
  const [pending, setPending] = useState(false);
  useEffect(() => {
    setPending(false);
  }, [gameState, isRoundOver, rouletteResult, swapPoolCards, isConnected]);
  useEffect(() => {
    if (pending) {
      const timer = setTimeout(() => setPending(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [pending]);
  if (!gameState || winnerName) return null;
  const me = gameState.me;
  const resolving =
    !!showdownResults || !!rouletteResult || gameState.isProcessingRoulette;
  const isMyTurn =
    gameState.currentTurnSeat === mySeatIndex &&
    !resolving &&
    !isRoundOver &&
    !me.isDead &&
    !me.folded;
  const disabled = !isConnected || !isMyTurn || !!swapPoolCards || pending;
  const nextBullet = Math.min(6, me.bullets + 1);
  const currentPlayer =
    gameState.opponents.find((o) => o.seatIndex === gameState.currentTurnSeat)
      ?.name || 'đối thủ';
  const act = (action: 'fold' | 'call' | 'allin') => {
    if (disabled) return;
    setPending(true);
    emitAction(currentRoomId, action);
  };
  const status = isRoundOver
    ? 'Một ván khép lại.'
    : rouletteResult
      ? `${rouletteResult.name} đang thử vận may…`
      : resolving
        ? 'Ngửa bài. Phân định thắng thua.'
        : me.isDead
          ? 'Bạn đã bị hạ. Tiếp tục theo dõi.'
          : me.folded
            ? 'Bạn đã bỏ bài. Chờ ván tiếp theo.'
            : isMyTurn
              ? 'Nước đi tiếp theo là của bạn.'
              : `Đang chờ ${currentPlayer}…`;
  return (
    <section
      className={`controls-dock ${isMyTurn ? 'your-turn' : ''}`}
      aria-label="Hành động của bạn"
    >
      <div className="controls-status">
        <div
          className={`turn-clock ${seconds <= 5 && isMyTurn ? 'urgent' : ''}`}
        >
          {isMyTurn ? (
            <>
              <b>{seconds}</b>
              <small>GIÂY</small>
            </>
          ) : (
            <Icon name={isRoundOver ? 'cards' : 'clock'} size={23} />
          )}
        </div>
        <div>
          <span className="eyebrow">
            {isRoundOver
              ? 'VÁN BÀI KẾT THÚC'
              : isMyTurn
                ? 'ĐẾN LƯỢT BẠN'
                : 'TẠI BÀN CHƠI'}
          </span>
          <p role="status">{status}</p>
        </div>
      </div>
      {isRoundOver ? (
        <button
          className="btn-primary"
          disabled={!isConnected || pending}
          onClick={() => {
            setPending(true);
            emitNextRound(currentRoomId);
          }}
        >
          VÁN TIẾP THEO <Icon name="arrow" />
        </button>
      ) : !resolving && !me.isDead && !me.folded ? (
        <div className="action-buttons">
          <button
            className="btn-act btn-fold"
            disabled={disabled}
            onClick={() => act('fold')}
          >
            <strong>Bỏ bài</strong>
            <small>Bóp cò ngay</small>
          </button>
          {!gameState.hasAnyAllIn && (
            <button
              className="btn-act btn-swap"
              disabled={disabled || !gameState.canSwap}
              title={
                me.hasUsedSwap
                  ? 'Đã dùng lượt đổi bài'
                  : 'Đổi 1 lá tại Flop hoặc Turn'
              }
              onClick={() => {
                setPending(true);
                emitSwapRequest(currentRoomId);
              }}
            >
              <strong>
                <Icon name="swap" size={16} /> Đổi bài
              </strong>
              <small>
                {me.hasUsedSwap
                  ? 'Đã sử dụng'
                  : gameState.canSwap
                    ? 'Một lần duy nhất'
                    : 'Từ vòng Flop'}
              </small>
            </button>
          )}
          {!gameState.hasAnyAllIn && (
            <button
              className="btn-act btn-call"
              disabled={disabled}
              onClick={() => act('call')}
            >
              <strong>
                Theo bài <span>+1</span>
              </strong>
              <small>
                {nextBullet}/6 viên · {Math.round((nextBullet / 6) * 100)}% có
                đạn
              </small>
            </button>
          )}
          <button
            className="btn-act btn-allin"
            disabled={disabled || !gameState.canAllIn}
            onClick={() => act('allin')}
          >
            <strong>Tất tay</strong>
            <small>
              {!gameState.canAllIn && me.hasUsedSwap && gameState.stage > 0
                ? 'Không thể tất tay sau khi đổi bài'
                : gameState.hasAnyAllIn
                  ? 'Theo tất tay · 6/6 viên'
                  : gameState.stage === 0
                    ? 'Từ vòng Flop'
                    : '6/6 viên · All-in'}
            </small>
          </button>
        </div>
      ) : (
        <span className="controls-passive">
          {resolving ? 'KẾT QUẢ ĐANG ĐƯỢC PHÂN ĐỊNH' : 'CHẾ ĐỘ THEO DÕI'}
        </span>
      )}
    </section>
  );
};
