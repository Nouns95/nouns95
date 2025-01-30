# Nouns95 - Windows 95-Inspired Blockchain Interface

A modern web application that reimagines the classic Windows 95 interface with integrated blockchain capabilities. Built with Next.js, TypeScript, and modern web technologies, this project combines nostalgia with cutting-edge blockchain functionality.

![Nouns95 Interface](public/icons/apps/wallet/wallet.png)

## Features

### 🪟 Classic Windows 95 Interface
- Authentic Windows 95 look and feel
- Draggable and resizable windows
- Start menu and taskbar functionality
- Multi-window management with proper z-indexing
- Context menus and system tray

### 💼 Integrated Blockchain Wallet
- Support for Ethereum (via wagmi and privy)
- Solana integration (@solana)
- View balances and transaction history
- NFT management and display
- Secure wallet connection persistence

### 📁 File System
- Virtual file system with familiar interface
- File and directory management
- Download manager with progress tracking
- Local file caching for offline access

### 🔄 Modern Architecture
- Built with Next.js and TypeScript
- GraphQL for efficient data fetching
- Modular component architecture
- Responsive and accessible design

## Getting Started

### Prerequisites
- Node.js 18.0 or higher
- npm or yarn package manager
- A modern web browser

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/nouns95.git
cd nouns95
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```
Edit `.env.local` with your configuration values.

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

Visit `http://localhost:3000` to see the application.

## Project Structure

```
src/
├── presentation/           # UI components and layouts
│   ├── apps/              # Individual applications
│   ├── components/        # Reusable UI components
│   ├── providers/         # React context providers
│   └── styles/            # Global styles and themes
├── domain/                # Business logic and services
│   ├── window/           # Window management
│   ├── fileSystem/       # File system operations
│   └── blockchain/       # Blockchain services
├── data/                 # Data management
│   ├── stores/           # State management
│   ├── persistence/      # Data persistence
│   └── api/              # API integrations
└── utils/                # Utility functions and helpers
```

## Technology Stack

- **Frontend Framework**: Next.js with TypeScript
- **Styling**: CSS Modules with Windows 95 theme
- **State Management**: Custom stores with React Context
- **Blockchain Integration**: 
  - Ethereum: wagmi and privy
  - Solana: @solana/web3.js
- **Data Fetching**: GraphQL
- **Deployment**: Vercel

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Development Guidelines

### Windows 95 Styling
- Use the defined color palette (Window Background: #C0C0C0, Titlebar: #000080, etc.)
- Follow Windows 95 component styling (borders, shadows, buttons)
- Use "MS Sans Serif" font family
- Maintain pixel-perfect spacing (8px window padding, 4px button padding)

### Code Standards
- Write clean TypeScript with proper type definitions
- Follow the modular architecture in `src/` directory
- Keep components small and focused
- Handle errors gracefully

### Performance
- Implement lazy loading for applications
- Optimize window rendering
- Use efficient state updates
- Handle background processes properly

## License

This project is licensed under the WTFPL - Do What The F*ck You Want To Public License. 
See the [LICENSE](LICENSE) file for details, or check out http://www.wtfpl.net/ for more information.

## Acknowledgments

- Windows 95 design inspiration
- Next.js team for the framework
- Nouns
- Blockchain protocol teams
- Open source community
- Funded by https://flows.wtf

---

Built by Macrohard
