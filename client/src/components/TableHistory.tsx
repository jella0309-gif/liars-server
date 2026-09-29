import React from 'react';
import { useGameStore } from '../store/gameStore';

export function TableHistory() {
  const history = useGameStore((state) => state.history);
  return (
    <details
      className="table-history"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.currentTarget.open = false;
          event.currentTarget.querySelector('summary')?.focus();
        }
      }}
    >
      <summary>CHUYỆN TRÊN BÀN <span>{history.length}</span></summary>
      <div className="history-list" aria-label="Lịch sử ván chơi">
        {history.length ? history.map((entry, i) => (
          <div
            className={`history-item ${i === 0 ? 'latest' : ''}`}
            key={`${history.length - i}-${entry}`}
          >
            <span className="history-dot" />
            <p>{entry}</p>
          </div>
        )) : <p className="history-empty">Diễn biến sẽ xuất hiện ở đây.</p>}
      </div>
    </details>
  );
}
