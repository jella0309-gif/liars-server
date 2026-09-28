import React, { useState } from 'react';
import { AVATARS } from '@liars-bar/shared';
import { useGameStore } from '../store/gameStore';
import { emitCreateRoom, emitJoinRoom } from '../socket';
import { unlockAudioContext } from '../utils/audio';

export const Lobby: React.FC = () => {
  const isConnected = useGameStore((state) => state.isConnected);
  const isLobbyOpen = useGameStore((state) => state.isLobbyOpen);

  const [selectedAvatar, setSelectedAvatar] = useState('🤠');
  const [playerName, setPlayerName] = useState('Người chơi 1');
  const [maxPlayers, setMaxPlayers] = useState(2);
  const [roomCode, setRoomCode] = useState('');

  if (!isLobbyOpen) return null;

  const handleStartBotMode = () => {
    unlockAudioContext();
    emitCreateRoom({
      playerName: playerName.trim() || 'Người chơi 1',
      avatar: selectedAvatar,
      maxPlayers: 2,
      addBots: true
    });
  };

  const handleHostRoom = () => {
    unlockAudioContext();
    emitCreateRoom({
      playerName: playerName.trim() || 'Host',
      avatar: selectedAvatar,
      maxPlayers,
      addBots: false
    });
  };

  const handleJoinRoom = () => {
    unlockAudioContext();
    if (!roomCode.trim()) {
      alert('Vui lòng nhập mã phòng!');
      return;
    }
    emitJoinRoom({
      roomId: roomCode.trim().toUpperCase(),
      playerName: playerName.trim() || 'Bạn',
      avatar: selectedAvatar
    });
  };

  return (
    <div className="lobby-overlay">
      <div className="lobby-card">
        <h2>🔫 LIAR'S BAR POKER</h2>
        <p style={{ color: isConnected ? '#22c55e' : '#94a3b8' }}>
          {isConnected
            ? '🟢 Đã kết nối máy chủ! Tạo phòng, vào phòng hoặc chơi với Bot.'
            : 'Đang kết nối Server...'}
        </p>

        <div className="section-label">1. Chọn nhân vật đại diện:</div>
        <div className="avatar-grid">
          {AVATARS.map((emoji) => (
            <div
              key={emoji}
              className={`avatar-item ${emoji === selectedAvatar ? 'selected' : ''}`}
              onClick={() => {
                unlockAudioContext();
                setSelectedAvatar(emoji);
              }}
            >
              {emoji}
            </div>
          ))}
        </div>

        <div className="section-label">2. Tên của bạn:</div>
        <input
          type="text"
          className="lobby-input"
          placeholder="Nhập tên..."
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
        />

        <div className="section-label">3. Số người chơi (Khi tạo phòng online):</div>
        <div className="player-select-row">
          {[2, 3, 4].map((num) => (
            <button
              key={num}
              type="button"
              className={`btn-num ${num === maxPlayers ? 'active' : ''}`}
              onClick={() => {
                unlockAudioContext();
                setMaxPlayers(num);
              }}
            >
              {num === 2 ? '2 Người (Solo)' : `${num} Người`}
            </button>
          ))}
        </div>

        <div className="section-label">4. Mã phòng (Chơi Online):</div>
        <input
          type="text"
          className="lobby-input"
          placeholder="Nhập mã phòng nếu vào phòng bạn..."
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
        />

        <div className="lobby-btn-group">
          <button className="btn-lobby btn-bot" onClick={handleStartBotMode}>
            🤖 CHƠI VỚI BOT (SOLO OFFLINE)
          </button>
          <div className="lobby-btn-row">
            <button className="btn-lobby btn-host" onClick={handleHostRoom}>
              TẠO PHÒNG MỚI
            </button>
            <button className="btn-lobby btn-join" onClick={handleJoinRoom}>
              VÀO PHÒNG BẠN
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
