import React from 'react';

/** Decorative only: no transforms or clipping on the gameplay/overlay root. */
export function TableSurface() {
  return (
    <div className="felt-surface" aria-hidden="true">
      <div className="felt-emblem">♠</div>
      <div className="table-stitch" />
    </div>
  );
}
