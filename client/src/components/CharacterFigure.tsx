import React, { useEffect, useId, useState } from 'react';
import {
  CharacterPortrait,
  moodLabel,
  getCharacter,
  type CharacterMood,
} from './CharacterPortrait';
import {
  characterAlignment,
  characterFrames,
  markAssetFailed,
  preloadCharacterAssets,
  stateViewBox,
  useCharacterAssetUrl,
  type CharacterId,
} from './characterAssets';

const CROSSFADE_MS = 240;

/** Artwork adapter only. Seat owns mood derivation; CSS owns the seat anchor.
 * Draws the transparent gameplay art, or the portrait sheet if it is missing.
 */
export function CharacterFigure({ avatar, mood, label }: {
  avatar: string;
  mood: CharacterMood;
  label: string;
}) {
  const character = getCharacter(avatar);
  const id = character.id;
  // WebP → PNG chain; null means both failed for this state.
  const url = useCharacterAssetUrl(id, mood);
  // The outgoing mood stays mounted briefly so the two states crossfade.
  const [shownMood, setShownMood] = useState(mood);
  const [leaving, setLeaving] = useState<CharacterMood | null>(null);
  if (mood !== shownMood) {
    setShownMood(mood);
    setLeaving(shownMood);
  }
  useEffect(() => preloadCharacterAssets(id), [id]);
  useEffect(() => {
    if (!leaving) return;
    const t = setTimeout(() => setLeaving(null), CROSSFADE_MS + 20);
    return () => clearTimeout(t);
  }, [leaving]);

  if (!url)
    return (
      <div className="seat-portrait-wrap character-figure">
        <CharacterPortrait avatar={avatar} mood={mood} alignTop />
        <span className="seat-state-label">{label}</span>
      </div>
    );
  const align = characterAlignment[id];
  return (
    <div
      className="seat-portrait-wrap character-figure has-art"
      data-figure={id}
      data-mood={mood}
    >
      <div
        className="character-art figure-art"
        role="img"
        aria-label={`${character.name} — ${moodLabel(mood)}`}
      >
        <div
          className="figure-stage"
          style={{
            '--art-scale': align.scale,
            '--art-x': `${align.x}%`,
            '--art-y': `${align.y}%`,
          } as React.CSSProperties}
        >
          {leaving && (
            <FigureLayer key={leaving} id={id} mood={leaving} phase="leaving" />
          )}
          <FigureLayer key={mood} id={id} mood={mood} phase={leaving ? 'entering' : undefined} />
        </div>
      </div>
      <span className="seat-state-label">{label}</span>
    </div>
  );
}

function FigureLayer({ id, mood, phase }: {
  id: CharacterId;
  mood: CharacterMood;
  phase?: 'entering' | 'leaving';
}) {
  const maskId = `figure-mask${useId().replace(/:/g, '')}`;
  // Each layer (the leaving one included) resolves its own source chain.
  const url = useCharacterAssetUrl(id, mood);
  const { width, height, states } = characterFrames[id];
  const viewBox = stateViewBox(id, mood);
  const { hide } = states[mood];
  if (!url) return null; // Both formats failed; the parent shows the portrait.
  return (
    <svg
      className={`figure-layer ${phase ?? ''}`}
      viewBox={viewBox.join(' ')}
      preserveAspectRatio="xMidYMax meet"
      aria-hidden="true"
    >
      {hide.length > 0 && (
        <mask id={maskId} maskUnits="userSpaceOnUse" x={0} y={0} width={width} height={height}>
          <rect width={width} height={height} fill="#fff" />
          {hide.map(([x, y, w, h]) => (
            <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} fill="#000" />
          ))}
        </mask>
      )}
      <image
        href={url}
        width={width}
        height={height}
        mask={hide.length > 0 ? `url(#${maskId})` : undefined}
        onError={() => markAssetFailed(url)}
      />
    </svg>
  );
}
