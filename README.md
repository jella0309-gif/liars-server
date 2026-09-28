# 🔫 Liar's Bar Poker v2.0

Trò chơi Poker kết hợp Russian Roulette — chơi online hoặc với Bot.

## Kiến trúc

```
liars-bar/
├── shared/          # Types & constants dùng chung
├── server/          # Backend (Express + Socket.IO + TypeScript)
│   └── src/game/    # Game engine chạy server-side
├── client/          # Frontend (Vite + TypeScript)
│   ├── src/ui/      # UI modules (lobby, table, roulette, audio...)
│   └── src/styles/  # CSS split by concern
└── package.json     # Root workspace
```

**Server-Authoritative**: Toàn bộ game logic (chia bài, tính điểm, kết quả roulette) chạy trên server. Client chỉ hiển thị và gửi input.

## Cài đặt & Chạy

```bash
# Install dependencies
npm install

# Development (chạy server + client dev server cùng lúc)
# Terminal 1:
npm run dev:server

# Terminal 2:
npm run dev:client

# Production build
npm run build
npm start
```

## Tech Stack

| Layer   | Công nghệ          |
|---------|---------------------|
| Server  | Node.js, TypeScript, Express, Socket.IO |
| Client  | Vite, TypeScript, Socket.IO Client |
| Shared  | TypeScript types & constants |
| Validate| Zod (server-side input validation) |

## So sánh với v1.0

| Tiêu chí | v1.0 (cũ) | v2.0 (mới) |
|-----------|-----------|-------------|
| Files | 3 files (1 HTML 2040 dòng) | 38+ files modular |
| Game Logic | Client-side (hackable) | Server-side (secure) |
| Bài đối thủ | Gửi hết cho client | Server giữ, chỉ gửi khi showdown |
| Validation | Không có | Zod schemas |
| TypeScript | Không | Toàn bộ |
| Reconnect | Không | Token-based |
| Build tool | Không | Vite |
