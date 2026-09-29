import React, { useState } from 'react';
import { Seat } from './Seat';
import { PlayingCard } from './PlayingCard';
import { RouletteModal } from './RouletteModal';
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
    history,
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
    <main className="game-page">
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
            <div className="felt-surface" aria-hidden="true">
              <div className="felt-emblem">♠</div>
              <div className="table-stitch" />
            </div>
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
                  <div className="table-brand">
                    LIAR'S <span>BAR</span>
                    <small>TRUST NO ONE. PLAY YOUR HAND.</small>
                  </div>
                  <div className="board-label">
                    <span />
                    BÀI CHUNG
                    <span />
                  </div>
                  <div className="comm-cards" key={roundNumber}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <div className="community-slot" key={i}>
                        {cards[i] ? (
                          <PlayingCard
                            card={cards[i]}
                            delay={i < 3 ? i * 120 : 0}
                          />
                        ) : (
                          <div className="card-placeholder">
                            <span>♠</span>
                            <small>
                              {i < 3 ? 'FLOP' : i === 3 ? 'TURN' : 'RIVER'}
                            </small>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
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
          <RouletteModal />
        </section>
        <aside className="game-sidebar">
          <div className="sidebar-heading">
            <span className="eyebrow">CHUYỆN TRÊN BÀN</span>
            <span className="live-dot" />
          </div>
          <h2>
            Mọi nước đi
            <br />
            đều để lại dấu vết.
          </h2>
          <div className="history-list" aria-label="Lịch sử ván chơi">
            {history.length ? (
              history.map((entry, i) => (
                <div
                  className={`history-item ${i === 0 ? 'latest' : ''}`}
                  key={`${history.length - i}-${entry}`}
                >
                  <span className="history-dot" />
                  <p>{entry}</p>
                </div>
              ))
            ) : (
              <p className="history-empty">
                Yên lặng trước giờ chia bài.
                <br />
                Diễn biến sẽ xuất hiện ở đây.
              </p>
            )}
          </div>
          <div className="table-reminder">
            <Icon name="shield" size={23} />
            <span>MỘT CƠ HỘI ĐỔI VẬN</span>
            <p>
              Ở Flop hoặc Turn, bạn có thể đổi một lá tẩy. Hãy dùng đúng lúc.
            </p>
          </div>
          <div className="sidebar-suits">♠ &nbsp; ♥ &nbsp; ♣ &nbsp; ♦</div>
        </aside>
      </div>
    </main>
  );
};
