import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { setBgmVolume, setSfxVolume, toggleBgm } from '../utils/audio';
import { Icon } from './Icon';
import { Dialog } from './Dialog';
export const Header: React.FC = () => {
  const { isLobbyOpen, isConnected } = useGameStore();
  const [panel, setPanel] = useState<'sound' | 'rules' | 'leave' | null>(null);
  const [bgm, setBgm] = useState(20),
    [sfx, setSfx] = useState(80),
    [musicOn, setMusicOn] = useState(false);
  return (
    <>
      <header className="site-header">
        <div className="brand">
          <span className="brand-emblem">♠</span>
          <div>
            LIAR'S <span>BAR</span>
            <small>TRUST NO ONE. PLAY YOUR HAND.</small>
          </div>
        </div>
        <nav className="header-nav" aria-label="Điều hướng chính">
          <button
            className="nav-active"
            onClick={() => {
              document
                .querySelector(isLobbyOpen ? '#join-table' : '.game-page')
                ?.scrollIntoView({
                  behavior: matchMedia('(prefers-reduced-motion: reduce)')
                    .matches
                    ? 'auto'
                    : 'smooth',
                  block: 'start',
                });
            }}
          >
            <Icon name="cards" size={16} />
            {isLobbyOpen ? 'CHƠI' : 'BÀN CHƠI'}
          </button>
          {isLobbyOpen && (
            <button
              onClick={() => {
                document
                  .querySelector('#character-selection')
                  ?.scrollIntoView({
                    behavior: matchMedia('(prefers-reduced-motion: reduce)')
                      .matches
                      ? 'auto'
                      : 'smooth',
                    block: 'center',
                  });
              }}
            >
              <Icon name="users" size={16} />
              NHÂN VẬT
            </button>
          )}
          <button onClick={() => setPanel('sound')}>
            <Icon name="sound" size={16} />
            ÂM THANH
          </button>
        </nav>
        <div className="header-controls">
          <span className={`server-status ${isConnected ? 'online' : ''}`}>
            <i />
            {isConnected ? 'TRỰC TUYẾN' : 'KẾT NỐI…'}
          </span>
          <button
            className="icon-button"
            aria-label="Cài đặt âm thanh"
            onClick={() => setPanel('sound')}
          >
            <Icon name="sound" />
          </button>
          <button
            className="help-button"
            aria-label="Cách chơi"
            onClick={() => setPanel('rules')}
          >
            <Icon name="help" size={18} />
            <span>Cách chơi</span>
          </button>
          {!isLobbyOpen && (
            <button
              className="icon-button"
              aria-label="Rời phòng"
              onClick={() => setPanel('leave')}
            >
              <Icon name="exit" />
            </button>
          )}
        </div>
      </header>
      {panel && (
        <Dialog
          label={
            panel === 'rules'
              ? 'Cách chơi'
              : panel === 'sound'
                ? 'Âm thanh'
                : 'Rời bàn chơi'
          }
          onClose={() => setPanel(null)}
        >
          <button
            className="dialog-close icon-button"
            aria-label="Đóng"
            onClick={() => setPanel(null)}
          >
            <Icon name="close" />
          </button>
          {panel === 'rules' ? (
            <>
              <span className="eyebrow">LUẬT CỦA BÀN</span>
              <h2>
                Bài trên tay.
                <br />
                Mạng trên bàn.
              </h2>
              <ol className="rules-list">
                <li>
                  <strong>Ghép bộ bài mạnh nhất</strong>
                  <p>
                    Dùng 2 lá tẩy và 5 lá chung để tạo bộ 5 lá mạnh nhất. Bài
                    chung lần lượt mở ở Flop, Turn và River.
                  </p>
                </li>
                <li>
                  <strong>Mỗi quyết định đều có giá</strong>
                  <p>
                    Theo bài thêm 1 viên đạn. Bỏ bài phải bóp cò ngay. Tất tay
                    nạp đủ 6 viên và buộc đối thủ tất tay hoặc bỏ bài.
                  </p>
                </li>
                <li>
                  <strong>Một cơ hội đổi vận</strong>
                  <p>
                    Đổi 1 lá tẩy một lần mỗi ván, ở Flop hoặc Turn. Hành động
                    trước khi hết thời gian 30 giây; hết giờ sẽ tự bỏ bài.
                  </p>
                </li>
                <li>
                  <strong>Sống sót đến cuối cùng</strong>
                  <p>
                    Khi ngửa bài, người thua phải bóp cò. Còn sống thì chơi ván
                    tiếp. Người sống sót cuối cùng thắng trận.
                  </p>
                </li>
              </ol>
              <button className="btn-primary" onClick={() => setPanel(null)}>
                ĐÃ HIỂU LUẬT <Icon name="check" />
              </button>
            </>
          ) : panel === 'sound' ? (
            <>
              <span className="eyebrow">KHÔNG KHÍ QUÁN BAR</span>
              <h2>Âm thanh</h2>
              <div className="sound-setting">
                <span>Nhạc nền</span>
                <button
                  className="btn-secondary"
                  aria-pressed={musicOn}
                  onClick={() => setMusicOn(toggleBgm())}
                >
                  {musicOn ? 'Đang bật' : 'Đang tắt'}
                </button>
              </div>
              <label className="sound-setting" htmlFor="bgm-volume">
                Âm lượng nhạc <span>{bgm}%</span>
              </label>
              <input
                id="bgm-volume"
                type="range"
                min="0"
                max="100"
                value={bgm}
                onChange={(e) => {
                  setBgm(+e.target.value);
                  setBgmVolume(+e.target.value);
                }}
              />
              <label className="sound-setting" htmlFor="sfx-volume">
                Hiệu ứng & giọng nói <span>{sfx}%</span>
              </label>
              <input
                id="sfx-volume"
                type="range"
                min="0"
                max="100"
                value={sfx}
                onChange={(e) => {
                  setSfx(+e.target.value);
                  setSfxVolume(+e.target.value);
                }}
              />
            </>
          ) : (
            <>
              <span className="eyebrow">RỜI BÀN</span>
              <h2>Rời cuộc chơi?</h2>
              <p>
                Ván chơi hiện tại sẽ tiếp tục. Bạn sẽ trở về sảnh chọn nhân vật.
              </p>
              <div className="dialog-actions">
                <button
                  className="btn-secondary"
                  onClick={() => setPanel(null)}
                >
                  Ở lại bàn
                </button>
                <button
                  className="btn-primary"
                  onClick={() => location.reload()}
                >
                  Rời phòng <Icon name="exit" />
                </button>
              </div>
            </>
          )}
        </Dialog>
      )}
    </>
  );
};
