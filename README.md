# Nouns95

A Windows 95-style interface for interacting with Nouns DAO, featuring real-time auctions and governance.

## Features

- **Windows 95 Interface**
  - Authentic Windows 95 look and feel
- Window management system
  - Taskbar with active applications
  - Desktop icons and shortcuts

- **Nouns Auction**
  - Live auction tracking with real-time updates
  - Bidding interface with Windows 95 styling
  - Crystal Ball feature for previewing future Nouns
  - Auction history browsing
  - Trait exploration

- **Governance**
  - Proposal viewing and tracking
  - Candidate proposal system
  - Voting interface
  - Feedback mechanism

## Project Structure

```
src/
├── Apps/                 # Main application modules
│   ├── Nouns/            # Core Nouns functionality
│   │   ├── Auction/      # Auction interface and logic
│   │   ├── Governance/   # DAO governance features
│   │   ├── Studio/       # MS Paint Style Nouns Studio
│   │   └── domain/       # Shared Nouns domain logic
│   ├── Windows/          # Window system components
│   └── MiniApps/         # Smaller utility applications
├── shell/                # Windows 95 UI framework
│   ├── Desktop/          # Desktop and icon management
│   ├── Window/           # Window management system
│   ├── Taskbar/          # Taskbar and start menu
│   ├── ContextMenu/      # Right-click menu system
│   └── Shell/            # Core shell functionality
├── config/               # Application configuration
├── context/              # React context providers
├── lib/                  # Core libraries and utilities
├── types/                # TypeScript type definitions
├── utils/                # Helper functions
└── wrappers/             # Higher-order components
```

## Shell System

The shell system provides the core Windows 95 functionality and user interface components. 
It's organized into several key subsystems:

### Desktop System
- Manages the main workspace area
- Handles icon placement and grid alignment
- Controls desktop background and customization

### Window Management
- Provides window creation and destruction
- Handles window focusing and z-index ordering
- Supports window dragging, resizing, and snapping
- Manages window state (minimized, maximized, restored)
- Implements the classic Windows 95 window borders and controls

### Taskbar
- Shows running applications
- Implements the Start Menu system
- Displays system tray with clock
- Handles window minimization and restoration
- Manages taskbar button states and interactions

### Context Menus
- Provides right-click menu functionality
- Supports nested menu items
- Handles menu positioning and overflow
- Implements Windows 95-style menu appearance

### Core Shell Features
- Event handling system for OS-level interactions
- Focus management between windows and applications
- System-wide keyboard shortcuts
- Window message passing and communication

## Window Management System

The window management system is built on a robust configuration-driven architecture that enables Windows 95-style window behaviors and appearances. The system is composed of two main parts:

### AppConfig System

The `AppConfig.ts` file serves as the central configuration hub that defines how applications integrate with the shell system. Each application is defined with:

```typescript
interface AppWindowConfig {
  type: 'window' | 'miniapp';
  title: string;
  size: {
    defaultSize: WindowDimensions;
    minSize?: WindowDimensions;
    maxSize?: WindowDimensions;
  };
  position: {
    preferred: 'center' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | WindowCoordinates;
    margins: WindowMargins;
  };
  behavior: {
    canResize: boolean;
    canMinimize: boolean;
    canMaximize: boolean;
    stackingOffset?: WindowCoordinates;
  };
  metadata?: {
    icon?: string;
    description?: string;
    category?: string;
  };
  component: React.ComponentType;
}
```

Key features of the AppConfig system:
- Defines window types (full windows vs. mini-apps)
- Controls window sizing and positioning
- Sets window behaviors and constraints
- Manages window metadata and icons
- Handles component mounting and lifecycle

### Window Manager Features

The Window Manager implements the following key features:

1. **Window State Management**
   - Tracks active/focused windows
   - Manages window z-index ordering
   - Handles window lifecycle (create, destroy, minimize, maximize)

2. **Window Positioning**
   - Smart initial positioning system
   - Handles cascading windows
   - Implements snapping and edge detection
   - Manages screen bounds

3. **Window Interactions**
   - Drag and drop support
   - Resize handling with constraints
   - Focus management between windows
   - Window button actions (minimize, maximize, close)

4. **Window Types**
   - Standard resizable windows
   - Fixed-size mini-apps
   - Modal windows
   - System dialogs

### Integration Example

To create a new window application:

1. Define the app configuration in `AppConfig.ts`:
```typescript
myApp: {
  type: 'window',
  title: 'My App',
  size: {
    defaultSize: {
      width: { value: 50, unit: 'rem' },
      height: { value: 37.5, unit: 'rem' }
    }
  },
  position: {
    preferred: 'center',
    margins: DEFAULT_MARGINS
  },
  behavior: {
    canResize: true,
    canMinimize: true,
    canMaximize: true
  },
  component: MyAppComponent
}
```

2. The Window Manager will automatically handle:
   - Window creation and positioning
   - Window controls and behaviors
   - Window state management
   - Integration with the taskbar

## Applications

Nouns 95 includes several built-in applications and supports custom application development.

### Core Applications

#### Nouns Auction
- Real-time auction interface for Nouns NFTs
- Live bidding functionality with Ethereum integration
- Auction history and navigation
- Crystal Ball feature for previewing future Nouns
- Trait exploration and statistics
- Configurable as both window and mini-app modes

#### Governance
- Complete Nouns DAO governance interface
- Proposal creation and management
- Voting system with delegation support
- Candidate proposal system with feedback
- Proposal history and tracking
- Transaction details and verification

#### Studio
- MS Paint-style Nouns creation interface
- Pixel-perfect trait editing
- Custom trait composition
- Real-time preview
- Save and export functionality
- Windows 95-style drawing tools
- Layer management system
- Color palette customization

### System Applications

#### File Explorer
- Directory navigation and browsing
- File operations and management
- Custom file type associations
- Integration with other applications

#### Wallet
- Appkit wallet integration
- Balance monitoring
- Transaction history
- Network switching
- Runs as a mini-app in the system tray

#### Chat
- Push Protocol integration
- Direct messaging
- Group chat support
- Notification system
- Minimizable window interface

### Developing Custom Applications

Nouns 95 supports custom application development through its modular architecture.

#### Application Types

1. **Window Applications**
   - Full-featured windows with complete window controls
   - Resizable and movable interfaces
   - Integration with taskbar and window management

2. **Mini Applications**
   - Compact, focused interfaces
   - Fixed positioning options
   - Ideal for utilities and widgets
   - System tray integration

#### Development Steps

1. **Create Application Component**
```typescript
// src/Apps/MyApp/index.tsx
import React from 'react';
import styles from './MyApp.module.css';

export function MyApp() {
  return (
    <div className={styles.container}>
      {/* Your app content */}
    </div>
  );
}
```

2. **Add Application Configuration**
```typescript
// src/Apps/AppConfig.ts
myApp: {
  type: 'window',  // or 'miniapp'
  title: 'My Application',
  size: {
    defaultSize: {
      width: { value: 50, unit: 'rem' },
      height: { value: 37.5, unit: 'rem' }
    }
  },
  position: {
    preferred: 'center',
    margins: DEFAULT_MARGINS
  },
  behavior: {
    canResize: true,
    canMinimize: true,
    canMaximize: true
  },
  metadata: {
    icon: 'myapp',          // Icon in public/icons/apps/
    description: 'My App',  // For tooltips and start menu
    category: 'utilities'   // For start menu organization
  },
  component: MyApp
}
```

3. **Add Styling**
```css
/* src/Apps/MyApp/MyApp.module.css */
.container {
  height: 100%;
  width: 100%;
  background: #c0c0c0;
  padding: 0.5rem;
}
```

## Tech Stack

### Core Framework
- **Framework**: Next.js 13+ with App Router
- **Language**: TypeScript
- **Styling**: CSS Modules with Windows 95 theme system

### State Management & Data Flow
- **Local State**: React Context API
- **Global State**: Zustand for shell system state
- **Data Fetching**: 
  - Apollo Client for GraphQL
  - SWR for REST endpoints
  - Server-side data fetching with Next.js

### Blockchain Integration
- **Multi-Chain Support**:
  - Ethereum Mainnet
  - Base L2
  - Solana
  - Bitcoin
- **Wallet Connectivity**: 
  - Appkit for unified wallet management
  - Wagmi hooks for Ethereum interactions
  - Ethers.js for custom contract interactions
  - Solana Web3.js for Solana integration
- **Data Sources**:
  - TheGraph for indexed blockchain data
  - Custom RPC endpoints
  - Nouns subgraph integration

### UI/UX Components
- **Windows 95 Shell**:
  - Custom window management system
  - Event-driven desktop environment
  - Pixel-perfect Windows 95 styling
- **Animations**: CSS transitions and keyframes
- **Icons**: Custom pixel art and Windows 95 style assets
- **Fonts**: MS Sans Serif (system font) with fallbacks

### Development Tools
- **Build Tools**:
  - Webpack 5
  - SWC for fast compilation
  - PostCSS for CSS processing
- **Code Quality**:
  - ESLint with custom rule set
  - Prettier for code formatting
  - TypeScript strict mode
  - Husky for Git hooks
- **Testing**:
  - Jest for unit testing
  - React Testing Library
  - Playwright for E2E testing

### Development Environment
- **Package Management**: npm with workspaces
- **Environment**: Node.js 18+
- **Version Control**: Git with conventional commits
- **CI/CD**: GitHub Actions
- **Deployment**: Vercel

### Key Dependencies
- **Blockchain**:
  - @appkit/react
  - @wagmi/core
  - ethers
  - @solana/web3.js
  - viem
- **Data & State**:
  - @apollo/client
  - zustand
  - swr
- **UI Components**:
  - react-draggable
  - react-rnd
  - @radix-ui/react-primitives
- **Development**:
  - typescript
  - eslint
  - prettier
  - jest
  - playwright

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+
- A modern web browser
- MetaMask or another Web3 wallet

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Nouns95/nouns95.git
cd nouns95
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```
NEXT_PUBLIC_ALCHEMY_ID=your_alchemy_id
NEXT_PUBLIC_WALLET_CONNECT_ID=your_walletconnect_project_id
```

4. Start the development server:
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

### Development Mode Features
- Hot module replacement
- Real-time TypeScript checking
- Development-only debugging tools
- Automatic GraphQL schema updates
- Local blockchain network support

### Production Build

To create a production build:
```bash
npm run build
npm run start
```

## Development Guidelines

### Code Style & Standards

#### TypeScript
- Use strict TypeScript mode
- Define explicit types for props and state
- Avoid `any` types unless absolutely necessary
- Use interfaces for object types
- Leverage TypeScript's utility types

#### React Best Practices
- Use functional components with hooks
- Implement proper cleanup in useEffect
- Memoize callbacks and values appropriately
- Keep components focused and single-purpose
- Use proper prop typing and validation

#### Windows 95 Styling
- Use the Windows 95 color palette:
  ```css
  --win95-bg: #c0c0c0;
  --win95-border-light: #ffffff;
  --win95-border-dark: #808080;
  --win95-border-darker: #404040;
  --win95-title-active: #000080;
  --win95-title-inactive: #808080;
  ```
- Follow pixel-perfect borders:
  - Outer border: 2px
  - Inner border: 1px
  - Button borders: 2px
- Use MS Sans Serif font family
- Maintain authentic Windows 95 behaviors
- Use CSS Modules for component styling

### Architecture Guidelines

#### Component Structure
- Place components in appropriate app directories
- Keep components small and focused
- Follow the container/presentation pattern
- Use shared components from shell system
- Implement proper error boundaries

#### State Management
- Use React Context for app-level state
- Implement Zustand stores for complex state
- Keep state close to where it's used
- Use proper state initialization
- Handle loading and error states

#### Performance
- Implement proper code splitting
- Use React.lazy for component loading
- Optimize re-renders with useMemo/useCallback
- Profile and optimize when necessary
- Handle cleanup in useEffect

## Contributing

### Getting Started

1. Fork the repository
2. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Enable pre-commit hooks:
   ```bash
   npm run prepare
   ```

### Development Process

1. **Planning**
   - Check existing issues and discussions
   - Create an issue for new features
   - Get feedback on implementation approach
   - Define scope and acceptance criteria

2. **Implementation**
   - Follow code style guidelines
   - Write tests for new features
   - Update documentation as needed
   - Keep commits focused and clean

3. **Testing**
   - Run the test suite
   - Perform manual testing
   - Test across different networks
   - Verify Windows 95 styling

4. **Submitting**
   - Push to your fork
   - Create a Pull Request
   - Fill out the PR template
   - Request review from maintainers

### Pull Request Guidelines

- Keep PRs focused and single-purpose
- Include relevant tests
- Update documentation
- Add screenshots for UI changes
- Follow commit message conventions
- Respond to review feedback
- Rebase on main when needed

### Commit Guidelines

- Use conventional commit messages:
  ```
  feat: add new feature
  fix: resolve specific issue
  docs: update documentation
  style: formatting changes
  refactor: code restructuring
  test: add or modify tests
  chore: maintenance tasks
  ```
- Keep commits atomic and focused
- Reference issues in commit messages
- Squash commits when appropriate