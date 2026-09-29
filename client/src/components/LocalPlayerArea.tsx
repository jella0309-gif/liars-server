import React from 'react';

/** Presentation slots keep the local viewpoint independent of opponent art. */
export function LocalPlayerArea({
  portrait,
  status,
  hand,
  result,
}: {
  portrait: React.ReactNode;
  status: React.ReactNode;
  hand: React.ReactNode;
  result: React.ReactNode;
}) {
  return (
    <div className="local-player-area">
      {portrait}
      <div className="seat-details">
        {status}
        {hand}
        {result}
      </div>
    </div>
  );
}
