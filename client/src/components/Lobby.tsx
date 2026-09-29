import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { emitCreateRoom, emitJoinRoom } from '../socket';
import {
  CharacterPortrait,
  CHARACTERS,
  MOODS,
  type CharacterMood,
} from './CharacterPortrait';
import { TIMING } from '@liars-bar/shared';
import { useT } from '../i18n';
import { Icon } from './Icon';
import { CharacterFigure } from './CharacterFigure';

export const Lobby: React.FC = () => {
  const { isConnected, isLobbyOpen, errorMessage, setError } = useGameStore();
  const t = useT();
  const [selectedAvatar, setSelectedAvatar] = useState<string>('🐵');
  const [playerName, setPlayerName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(2);
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState<'bot' | 'host' | 'join'>('bot');
  const [pending, setPending] = useState(false);
  const [previewMood, setPreviewMood] = useState<CharacterMood>('idle');
  const character = CHARACTERS.find((c) => c.avatar === selectedAvatar)!;
  useEffect(() => {
    if (errorMessage || !isConnected || !isLobbyOpen) setPending(false);
  }, [errorMessage, isConnected, isLobbyOpen]);
  useEffect(() => {
    if (!pending) return;
    const timeout = setTimeout(() => {
      setPending(false);
      setError(t('lobby.timeout'));
    }, 10000);
    return () => clearTimeout(timeout);
  }, [pending, setError, t]);
  if (!isLobbyOpen) return null;
  const selectCharacter = (avatar: string) => {
    setSelectedAvatar(avatar);
    setPreviewMood('idle');
  };
  const cycleCharacter = (direction: number) => {
    const index = CHARACTERS.findIndex((c) => c.avatar === selectedAvatar);
    selectCharacter(
      CHARACTERS[(index + direction + CHARACTERS.length) % CHARACTERS.length]
        .avatar
    );
  };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!isConnected || pending) return;
    setError(null);
    setPending(true);
    const identity = {
      playerName: playerName.trim() || character.name,
      avatar: selectedAvatar,
    };
    if (mode === 'join')
      emitJoinRoom({ ...identity, roomId: roomCode.trim().toUpperCase() });
    else emitCreateRoom({ ...identity, maxPlayers, addBots: mode === 'bot' });
  };
  const [waitingA, waitingB] = t('lobby.quote').split('\n');
  return (
    <main className="lobby-page" id="play">
      <div className="lobby-layout">
        <section className="character-selection" aria-label={t('lobby.section')}>
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="tiny-diamond" /> THE UNDERGROUND POKER CLUB
            </span>
            <h1>
              TRUST NO ONE.
              <br />
              <em>PLAY YOUR HAND.</em>
            </h1>
            <p>{t('lobby.hero.p')}</p>
            <div className="hero-figure" aria-hidden="true">
              <CharacterFigure avatar={selectedAvatar} mood={previewMood} label="" />
            </div>
          </div>
          <div className="section-heading" id="character-selection">
            <h2>
              <span>01</span> {t('lobby.pick')}
            </h2>
            <div className="roster-controls">
              <button
                type="button"
                className="icon-button"
                aria-label={t('lobby.prev')}
                onClick={() => cycleCharacter(-1)}
              >
                <Icon
                  name="arrow"
                  size={16}
                  style={{ transform: 'rotate(180deg)' }}
                />
              </button>
              <button
                type="button"
                className="icon-button"
                aria-label={t('lobby.next')}
                onClick={() => cycleCharacter(1)}
              >
                <Icon name="arrow" size={16} />
              </button>
            </div>
          </div>
          <div className="character-roster">
            {CHARACTERS.map((c, index) => (
              <button
                key={c.id}
                type="button"
                className={`character-choice ${selectedAvatar === c.avatar ? 'selected' : ''}`}
                aria-label={t('lobby.choose', { name: c.name })}
                aria-pressed={selectedAvatar === c.avatar}
                onClick={() => selectCharacter(c.avatar)}
                style={
                  {
                    '--character-accent': c.accent,
                    '--entry-delay': `${index * 65}ms`,
                  } as React.CSSProperties
                }
              >
                <CharacterPortrait avatar={c.avatar} mood="idle" />
                <span className="character-choice-name">{c.name}</span>
                <span className="character-check">
                  <Icon name="check" size={12} />
                </span>
              </button>
            ))}
          </div>
          <div className="character-profile">
            <CharacterPortrait avatar={selectedAvatar} mood={previewMood} />
            <div className="character-profile-copy">
              <span className="eyebrow">{t(`char.${character.id}.title`)}</span>
              <h3>
                {character.name}
                <span> / {t(`mood.${previewMood}`)}</span>
              </h3>
              <p>“{t(`char.${character.id}.quote`)}”</p>
              <div className="mood-switch" aria-label={t('lobby.moods')}>
                {MOODS.map((mood) => (
                  <button
                    key={mood}
                    type="button"
                    aria-pressed={previewMood === mood}
                    className={previewMood === mood ? 'active' : ''}
                    onClick={() => setPreviewMood(mood)}
                  >
                    {t(`mood.${mood}`)}
                  </button>
                ))}
              </div>
            </div>
            <span className="profile-suit" aria-hidden="true">
              ♠
            </span>
          </div>
          <div className="lobby-footnote">
            <Icon name="shield" size={14} />
            <span>{t('lobby.footnote')}</span>
          </div>
        </section>
        <aside className="entry-panel" id="join-table">
          <div className="entry-panel-top">
            <span className="eyebrow">{t('lobby.seat.eyebrow')}</span>
            <span className="suit-mark">♠</span>
          </div>
          <h2>{t('lobby.seat.title')}</h2>
          <p>{t('lobby.seat.p')}</p>
          <form onSubmit={submit}>
            <label className="field-label" htmlFor="player-name">
              {t('lobby.nick')} <span>{playerName.length}/20</span>
            </label>
            <div className="nickname-field">
              <input
                id="player-name"
                className="lobby-input"
                maxLength={20}
                autoComplete="nickname"
                placeholder={t('lobby.nick.ph', { name: character.name })}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                disabled={pending}
              />
              <button
                type="button"
                className="nickname-random"
                aria-label={t('lobby.nick.random')}
                disabled={pending}
                onClick={() => {
                  const names = t('lobby.names').split('|');
                  setPlayerName(
                    names[Math.floor(Math.random() * names.length)]
                  );
                }}
              >
                <Icon name="dice" />
              </button>
            </div>
            <span className="field-label">{t('lobby.mode')}</span>
            <div className="mode-tabs" role="group" aria-label={t('lobby.mode.group')}>
              {(
                [
                  { id: 'bot', icon: 'bot' },
                  { id: 'host', icon: 'plus' },
                  { id: 'join', icon: 'exit' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={mode === item.id}
                  className={mode === item.id ? 'active' : ''}
                  disabled={pending}
                  onClick={() => {
                    setMode(item.id);
                    setError(null);
                  }}
                >
                  <Icon name={item.icon} size={22} />
                  <span>{t(`lobby.mode.${item.id}`)}</span>
                </button>
              ))}
            </div>
            <div className="mode-description">
              <Icon name={mode === 'bot' ? 'crown' : 'users'} size={26} />
              <div>
                <strong>{t(`lobby.mode.${mode}.t`)}</strong>
                <p>{t(`lobby.mode.${mode}.p`)}</p>
              </div>
            </div>
            {mode === 'join' ? (
              <>
                <label className="field-label" htmlFor="room-code">
                  {t('lobby.code')}
                </label>
                <input
                  id="room-code"
                  className="lobby-input room-code-input"
                  placeholder="LB0000"
                  required
                  pattern="[Ll][Bb][0-9]{4}"
                  title={t('lobby.code.title')}
                  maxLength={6}
                  value={roomCode}
                  onChange={(e) =>
                    setRoomCode(e.target.value.toUpperCase().replace(/\s/g, ''))
                  }
                  disabled={pending}
                />
              </>
            ) : (
              <>
                <span className="field-label">{t('lobby.players')}</span>
                <div className="player-select-row">
                  {[2, 3, 4].map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={`btn-num ${n === maxPlayers ? 'active' : ''}`}
                      aria-pressed={n === maxPlayers}
                      disabled={pending}
                      onClick={() => setMaxPlayers(n)}
                    >
                      <Icon name="users" size={17} />
                      {t('lobby.players.n', { n })}
                    </button>
                  ))}
                </div>
              </>
            )}
            {errorMessage && (
              <p className="form-error" role="alert">
                {errorMessage}
              </p>
            )}
            <button
              className="btn-primary enter-game"
              disabled={!isConnected || pending}
              type="submit"
            >
              <span className="enter-spade" aria-hidden="true">♠</span>
              <span>
                <span className="enter-long">
                  {pending ? t('lobby.submit.pending') : t(`lobby.submit.${mode}`)}
                </span>
                <span className="enter-short">
                  {pending ? '…' : t(`lobby.short.${mode}`)}
                </span>
                <small>POKER · RUSSIAN ROULETTE</small>
              </span>
              <Icon name="arrow" />
            </button>
            <div
              className={`connection-note ${isConnected ? 'online' : ''}`}
              role="status"
            >
              <i />
              {isConnected ? t('lobby.online') : t('lobby.connecting')}
            </div>
          </form>
          <div className="entry-rule">
            <Icon name="crown" size={15} />
            <p>
              {waitingA}
              <br />
              {waitingB}
            </p>
            <span className="rule-suits">♠ &nbsp; ♥ &nbsp; ♣ &nbsp; ♦</span>
          </div>
        </aside>
      </div>
      <footer className="lobby-footer">
        <span>
          LIAR'S BAR <b> / </b> TRUST NO ONE. PLAY YOUR HAND.
        </span>
        <span>
          {t('lobby.footer')} <b>·</b>{' '}
          {t('lobby.footer.turn', { turn: TIMING.TURN_TIME_LIMIT })}
        </span>
        <span className="lobby-credits">
          <a href="https://www.instagram.com/_trunfun" target="_blank" rel="noopener noreferrer">
            Trunfun
          </a>
          <b>×</b>
          <a href="https://hdnng.vercel.app" target="_blank" rel="noopener noreferrer">
            HD
          </a>
        </span>
      </footer>
    </main>
  );
};
