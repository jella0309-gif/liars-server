import React, { useState } from 'react';
import { Seat } from './Seat';
import { CommunityCards } from './CommunityCards';
import { TableSurface } from './TableSurface';
import { TableHistory } from './TableHistory';
import { PlayerControls } from './PlayerControls';
import { useGameStore } from '../store/gameStore';
import { Icon } from './Icon';
import { STAGES } from '@liars-bar/shared';
import { seatPosition } from '../utils/seating';

export const PokerTable: React.FC = () => {
  const {
    gameState,
    tableLog,
    showdownResults,
    isRoundOver,
    roomMaxPlayers,
    mySeatIndex,
    playersInfo,
    roundNumber,
    currentRoomId,
  } = useGameStore();
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const count = gameState?.maxPlayers ?? roomMaxPlayers;
  const seats = Array.from({ length: count }, (_, i) => i);
  const cards = gameState?.communityCards || [];
  const stage = showdownResults ? 4 : (gameState?.stage ?? 0);
  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(currentRoomId);
      setCopied(true);
      setCopyError(false);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError(true);
    }
  };
  return (
    <main className="game-page game-table-scene">
      <div className="game-toolbar">
        <div>
          <span className="eyebrow">
            <span className="tiny-diamond" /> THE LAST SEAT STANDING
          </span>
          <h1>
            Bàn cược sinh tử
            <span>VÁN {String(roundNumber || 1).padStart(2, '0')}</span>
          </h1>
        </div>
        <div className="table-meta">
          <span className="table-capacity">
            <Icon name="users" size={17} />
            {count} NGƯỜI
          </span>
          <button
            className="room-code-button"
            onClick={copyCode}
            aria-label="Sao chép mã phòng"
          >
            <span>
              PHÒNG <b>{currentRoomId}</b>
            </span>
            <Icon name={copied ? 'check' : 'copy'} size={17} />
            {copied && <small>Đã sao chép</small>}
          </button>
        </div>
      </div>
      {copyError && (
        <p className="copy-fallback" role="status">
          Mã phòng: <strong>{currentRoomId}</strong> — bạn có thể chọn và sao
          chép mã này.
        </p>
      )}
      <div className="game-layout">
        <section className="game-arena" aria-label="Bàn Poker">
          <nav className="stage-track" aria-label="Các vòng bài">
            {STAGES.map((name, i) => (
              <span
                key={name}
                className={
                  stage === i && gameState
                    ? 'current'
                    : stage > i
                      ? 'complete'
                      : ''
                }
                aria-current={stage === i ? 'step' : undefined}
              >
                <i>{stage > i ? <Icon name="check" size={10} /> : i + 1}</i>
                {name}
              </span>
            ))}
          </nav>
          <div className={`poker-table seats-${count}`} data-seat-count={count}>
            <TableSurface />
            <div className="table-center">
              {!gameState ? (
                <div className="waiting-table">
                  <span className="eyebrow">BÀN ĐÃ MỞ</span>
                  <h2>
                    Đợi đủ mặt.
                    <br />
                    Bắt đầu cuộc chơi.
                  </h2>
                  <p>
                    {playersInfo.length}/{count} người đã vào bàn
                  </p>
                  <button className="btn-secondary" onClick={copyCode}>
                    <Icon name="copy" size={16} />
                    {copied ? 'Đã sao chép mã' : `Mời bạn · ${currentRoomId}`}
                  </button>
                </div>
              ) : (
                <>
                  <CommunityCards cards={cards} roundNumber={roundNumber} />
                  <div className="table-log" role="status">
                    <span className="tiny-diamond" />
                    {isRoundOver
                      ? 'Ván đã kết thúc. Sẵn sàng cho ván tiếp theo?'
                      : tableLog}
                  </div>
                  <div
                    key={`${roundNumber}-${stage}`}
                    className="stage-announcement"
                    aria-hidden="true"
                  >
                    {stage === 0 ? 'DEAL THE CARDS' : STAGES[stage]}
                  </div>
                </>
              )}
            </div>
            {seats.map((i) => (
              <div
                key={i}
                className={`seat-position pos-${seatPosition(i, mySeatIndex, count)} ${i === mySeatIndex ? 'local-seat' : ''}`}
                data-position={seatPosition(i, mySeatIndex, count)}
              >
                <Seat seatIndex={i} />
              </div>
            ))}
            <div className="table-edge-label" aria-hidden="true">
              ONE TABLE. DIFFERENT MASKS.
            </div>
          </div>
        </section>
      </div>
      <PlayerControls />
      <TableHistory />
    </main>
  );
};
