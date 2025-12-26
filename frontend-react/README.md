# PhishBlocker React Frontend

Modern React dashboard for PhishBlocker with beautiful UI and real-time updates.

## Features

- 🎨 Modern UI with Tailwind CSS
- 🌙 Dark mode support
- 📊 Interactive charts with Recharts
- ⚡ Real-time updates with React Query
- 🎭 Smooth animations with Framer Motion
- 📱 Fully responsive design

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
frontend-react/
├── src/
│   ├── components/
│   │   ├── dashboard/      # Dashboard components
│   │   └── layout/         # Layout components
│   ├── App.jsx            # Main app component
│   ├── main.jsx           # Entry point
│   └── index.css          # Global styles
├── public/                # Static assets
├── index.html            # HTML template
├── vite.config.js        # Vite configuration
├── tailwind.config.js    # Tailwind configuration
└── package.json          # Dependencies
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Configuration

### API Endpoint

The API endpoint is configured in `vite.config.js`:

```js
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    },
  },
}
```

### Dark Mode

Dark mode is automatically detected from system preferences and can be toggled manually.

## Components

### Dashboard Components

- **StatsCards** - Display key statistics with animations
- **URLScanner** - Scan URLs for phishing threats
- **ThreatChart** - Visualize threat distribution
- **ActivityChart** - Show scanning activity timeline
- **RecentScans** - Display recent scan results
- **ModelInfo** - Show ML model information

### Layout Components

- **Header** - Navigation header with dark mode toggle

## Technologies

- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Recharts** - Charts
- **React Query** - Data fetching
- **Lucide React** - Icons
- **Axios** - HTTP client

## License

MIT
