# Sketchh 📐

> A simple, fast, and real-time collaborative whiteboard and architectural sketching workspace.

Sketchh gives teams and individuals a tactile, clutter-free digital canvas to brainstorm ideas, draw system architectures, sketch flowcharts
and design together in real time with live cursor synchronization and multi-format exports.

---

## ✨ Features

- **🎨 Infinite Vector Precision Canvas**: High-DPI, infinite zoom, and smooth panning with clean technical grid lines.
- **🤝 Real-Time Multiplayer Collaboration**:
  - Live multiplayer cursor tracking with distinct collaborator tags and colors.
  - Sub-second room updates, element synchronization, and debounced auto-save via WebSockets.
  - Role-Based Access Control (**Owner**, **Editor**, **Viewer**) with tokenized invite links.
- **✏️ Natural Hand-Drawn Tools**:
  - Freehand pencil with variable lead weights (`0.3mm`, `0.5mm`).
  - Standard geometric primitives (rectangles, compass circles, lines, connector arrows).
  - Architect-style typography and text cards.
  - Multi-shape selection, drag-and-drop transformer controls, and 50-step undo/redo history.
- **📱 Mobile Responsive & Touch Optimized**:
  - Native gesture handling with `touch-action: none` prevents accidental page scrolling while sketching.
  - Two-finger pinch-to-zoom and two-finger canvas panning on touch screens.
- **🔐 Robust Session-Based Authentication**:
  - Migrated entirely away from client-side JWTs to secure `express-session` backed by MongoDB Atlas.
  - Passport.js authentication with local username/password and Google OAuth 2.0.
  - Support for creating multiple distinct accounts under a single email address.
- **📤 One-Click Multi-Format Export**:
  - Clean client-side rendering to high-resolution PNG, scalable vector SVG, or print-ready PDF.
- **🌓 Architectural Drafting Themes**:
  - Blue-ink technical blueprint light theme and graphite dark drafting theme.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 6](https://vitejs.dev/) with Rolldown chunk code splitting
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Canvas Engine**: HTML5 2D Canvas & [Konva / React-Konva](https://konvajs.org/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Real-Time Client**: [Socket.IO Client](https://socket.io/)
- **Icons**: [Lucide React](https://lucide.dev/)

### Backend
- **Runtime**: [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/) (TypeScript)
- **Database**: [MongoDB Atlas](https://www.mongodb.com/atlas) with [Mongoose](https://mongoosejs.com/)
- **Authentication**: [Passport.js](https://www.passportjs.org/) (`passport-google-oauth20`)
- **Session Storage**: `express-session` with `connect-mongo`
- **Real-Time Server**: [Socket.IO](https://socket.io/)
  
