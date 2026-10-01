import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { leaveRoom } from '../socket';
import { setBgmVolume, setSfxVolume, toggleBgm } from '../utils/audio';
import { REVOLVER, TIMING } from '@liars-bar/shared';
import { useI18n, useT } from '../i18n';
import { Icon } from './Icon';
import { Dialog } from './Dialog';
export const Header: React.FC = () => {
  const { isLobbyOpen, isConnected } = useGameStore();
  const { lang, setLang } = useI18n();
  const t = useT();
  const [panel, setPanel] = useState<'sound' | 'rules' | 'leave' | null>(null);
  const [bgm, setBgm] = useState(20),
    [sfx, setSfx] = useState(80),
    [musicOn, setMusicOn] = useState(true);
  const [rulesTitleA, rulesTitleB] = t('rules.title').split('\n');
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
        <nav className="header-nav" aria-label="Main navigation">
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
            {isLobbyOpen ? t('nav.play') : t('nav.table')}
          </button>
        </nav>
        <div className="header-controls">
          <span className={`server-status ${isConnected ? 'online' : ''}`}>
            <i />
            {isConnected ? t('header.online') : t('header.connecting')}
          </span>
          <button
            className="lang-button"
            aria-label={t('header.lang')}
            title={t('header.lang')}
            onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}
          >
            <b className={lang === 'vi' ? 'active' : ''}>VI</b>
            <span aria-hidden="true">/</span>
            <b className={lang === 'en' ? 'active' : ''}>EN</b>
          </button>
          <button
            className="icon-button"
            aria-label={t('header.sound')}
            onClick={() => setPanel('sound')}
          >
            <Icon name="sound" />
          </button>
          <button
            className="help-button"
            aria-label={t('header.help')}
            onClick={() => setPanel('rules')}
          >
            <Icon name="help" size={18} />
            <span>{t('header.help')}</span>
          </button>
          {!isLobbyOpen && (
            <button
              className="icon-button"
              aria-label={t('header.leave')}
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
              ? t('header.help')
              : panel === 'sound'
                ? t('sound.title')
                : t('leave.eyebrow')
          }
          onClose={() => setPanel(null)}
        >
          <button
            className="dialog-close icon-button"
            aria-label={t('dialog.close')}
            onClick={() => setPanel(null)}
          >
            <Icon name="close" />
          </button>
          {panel === 'rules' ? (
            <>
              <span className="eyebrow">{t('rules.eyebrow')}</span>
              <h2>
                {rulesTitleA}
                <br />
                {rulesTitleB}
              </h2>
              <ol className="rules-list">
                {([1, 2, 3, 4] as const).map((n) => (
                  <li key={n}>
                    <strong>{t(`rules.${n}.t`)}</strong>
                    <p>
                      {t(`rules.${n}.p`, {
                        cap: REVOLVER.CALL_BULLET_CAP,
                        turn: TIMING.TURN_TIME_LIMIT,
                      })}
                    </p>
                  </li>
                ))}
              </ol>
              <button className="btn-primary" onClick={() => setPanel(null)}>
                {t('rules.ok')} <Icon name="check" />
              </button>
            </>
          ) : panel === 'sound' ? (
            <>
              <span className="eyebrow">{t('sound.eyebrow')}</span>
              <h2>{t('sound.title')}</h2>
              <div className="sound-setting">
                <span>{t('sound.bgm')}</span>
                <button
                  className="btn-secondary"
                  aria-pressed={musicOn}
                  onClick={() => setMusicOn(toggleBgm())}
                >
                  {musicOn ? t('sound.on') : t('sound.off')}
                </button>
              </div>
              <label className="sound-setting" htmlFor="bgm-volume">
                {t('sound.bgmVolume')} <span>{bgm}%</span>
              </label>
              <input
                id="bgm-volume"
                type="range"
                min="0"
                max="100"
                value={bgm}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setBgm(value);
                  setBgmVolume(value);
                }}
                onInput={(e) => {
                  const value = Number(e.currentTarget.value);
                  setBgm(value);
                  setBgmVolume(value);
                }}
              />
              <label className="sound-setting" htmlFor="sfx-volume">
                {t('sound.sfxVolume')} <span>{sfx}%</span>
              </label>
              <input
                id="sfx-volume"
                type="range"
                min="0"
                max="100"
                value={sfx}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setSfx(value);
                  setSfxVolume(value);
                }}
                onInput={(e) => {
                  const value = Number(e.currentTarget.value);
                  setSfx(value);
                  setSfxVolume(value);
                }}
              />
            </>
          ) : (
            <>
              <span className="eyebrow">{t('leave.eyebrow')}</span>
              <h2>{t('leave.title')}</h2>
              <p>{t('leave.p')}</p>
              <div className="dialog-actions">
                <button
                  className="btn-secondary"
                  onClick={() => setPanel(null)}
                >
                  {t('leave.stay')}
                </button>
                <button className="btn-primary" onClick={leaveRoom}>
                  {t('leave.go')} <Icon name="exit" />
                </button>
              </div>
            </>
          )}
        </Dialog>
      )}
    </>
  );
};
