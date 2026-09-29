import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { emitCreateRoom, emitJoinRoom } from '../socket';
import {
  CharacterPortrait,
  CHARACTERS,
  MOOD_LABELS,
  type CharacterMood,
} from './CharacterPortrait';
import { Icon } from './Icon';

export const Lobby: React.FC = () => {
  const { isConnected, isLobbyOpen, errorMessage, setError } = useGameStore();
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
      setError('Chưa nhận được phản hồi. Bạn hãy thử lại.');
    }, 10000);
    return () => clearTimeout(timeout);
  }, [pending, setError]);
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
  return (
    <main className="lobby-page" id="play">
      <div className="lobby-layout">
        <section className="character-selection" aria-label="Chọn nhân vật">
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="tiny-diamond" /> THE UNDERGROUND POKER CLUB
            </span>
            <h1>
              TRUST NO ONE.
              <br />
              <em>PLAY YOUR HAND.</em>
            </h1>
            <p>
              Sáu gương mặt. Một bàn cược. Ai sẽ là người cuối cùng
              <br className="desktop-break" /> rời khỏi Liar's Bar?
            </p>
          </div>
          <div className="section-heading" id="character-selection">
            <h2>
              <span>01</span> CHỌN NHÂN VẬT CỦA BẠN
            </h2>
            <div className="roster-controls">
              <button
                type="button"
                className="icon-button"
                aria-label="Nhân vật trước"
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
                aria-label="Nhân vật tiếp theo"
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
                aria-label={`Chọn ${c.name}`}
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
              <span className="eyebrow">{character.title}</span>
              <h3>
                {character.name}
                <span> / {MOOD_LABELS[previewMood]}</span>
              </h3>
              <p>“{character.quote}”</p>
              <div className="mood-switch" aria-label="Xem biểu cảm">
                {(Object.keys(MOOD_LABELS) as CharacterMood[]).map((mood) => (
                  <button
                    key={mood}
                    type="button"
                    aria-pressed={previewMood === mood}
                    className={previewMood === mood ? 'active' : ''}
                    onClick={() => setPreviewMood(mood)}
                  >
                    {MOOD_LABELS[mood]}
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
            <span>Mọi nhân vật có cùng luật chơi. Chiến thuật là của bạn.</span>
          </div>
        </section>
        <aside className="entry-panel" id="join-table">
          <div className="entry-panel-top">
            <span className="eyebrow">CHIẾC GHẾ ĐANG CHỜ</span>
            <span className="suit-mark">♠</span>
          </div>
          <h2>Vào bàn.</h2>
          <p>Mang theo bản lĩnh. Để lại sự do dự.</p>
          <form onSubmit={submit}>
            <label className="field-label" htmlFor="player-name">
              BIỆT DANH CỦA BẠN <span>{playerName.length}/20</span>
            </label>
            <div className="nickname-field">
              <input
                id="player-name"
                className="lobby-input"
                maxLength={20}
                autoComplete="nickname"
                placeholder={`Ví dụ: ${character.name}`}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                disabled={pending}
              />
              <button
                type="button"
                className="nickname-random"
                aria-label="Gợi ý biệt danh"
                disabled={pending}
                onClick={() => {
                  const names = [
                    'Kẻ Giấu Bài',
                    'Tay Cược Đêm',
                    'Mặt Lạnh',
                    'Bóng Đêm',
                    'Át Chủ Bài',
                  ];
                  setPlayerName(
                    names[Math.floor(Math.random() * names.length)]
                  );
                }}
              >
                <Icon name="dice" />
              </button>
            </div>
            <span className="field-label">CHỌN CÁCH CHƠI</span>
            <div className="mode-tabs" role="group" aria-label="Chế độ chơi">
              {(
                [
                  { id: 'bot', label: 'Với Bot', icon: 'bot' },
                  { id: 'host', label: 'Tạo phòng', icon: 'plus' },
                  { id: 'join', label: 'Vào phòng', icon: 'exit' },
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
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
            <div className="mode-description">
              <Icon name={mode === 'bot' ? 'crown' : 'users'} size={26} />
              <div>
                <strong>
                  {mode === 'bot'
                    ? 'Luyện bản lĩnh cùng Bot'
                    : mode === 'host'
                      ? 'Một bàn riêng cho hội bạn'
                      : 'Bạn bè đang đợi bạn'}
                </strong>
                <p>
                  {mode === 'bot'
                    ? 'Bắt đầu ngay. Các ghế còn lại dành cho Bot.'
                    : mode === 'host'
                      ? 'Chia sẻ mã phòng để mời bạn bè vào bàn.'
                      : 'Nhập mã phòng được chủ bàn chia sẻ.'}
                </p>
              </div>
            </div>
            {mode === 'join' ? (
              <>
                <label className="field-label" htmlFor="room-code">
                  MÃ PHÒNG
                </label>
                <input
                  id="room-code"
                  className="lobby-input room-code-input"
                  placeholder="LB0000"
                  required
                  pattern="[Ll][Bb][0-9]{4}"
                  title="Mã phòng gồm LB và 4 chữ số"
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
                <span className="field-label">SỐ NGƯỜI TRÊN BÀN</span>
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
                      {n} người
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
              <span>
                {pending
                  ? 'Đang chuẩn bị bàn…'
                  : mode === 'bot'
                    ? 'BẮT ĐẦU VÁN BÀI'
                    : mode === 'host'
                      ? 'TẠO BÀN CHƠI'
                      : 'VÀO PHÒNG'}
                <small>POKER · RUSSIAN ROULETTE</small>
              </span>
              <Icon name="arrow" />
            </button>
            <div
              className={`connection-note ${isConnected ? 'online' : ''}`}
              role="status"
            >
              <i />
              {isConnected
                ? 'Máy chủ sẵn sàng · Kết nối trực tuyến'
                : 'Đang kết nối máy chủ…'}
            </div>
          </form>
          <div className="entry-rule">
            <Icon name="crown" size={15} />
            <p>
              “Ở đây, bài xấu chưa đáng sợ.
              <br />
              Hết may mắn mới đáng sợ.”
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
          2–4 NGƯỜI CHƠI <b>·</b> 30 GIÂY MỖI LƯỢT
        </span>
      </footer>
    </main>
  );
};
