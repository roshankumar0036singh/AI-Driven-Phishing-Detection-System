# PhishBlocker React Extension

Modern React-based Chrome extension for real-time phishing protection.

## Features

- 🎨 Modern UI with glassmorphism design
- 🔄 Real-time URL scanning
- 📊 Statistics tracking
- ⚙️ Customizable settings
- 🚫 Automatic threat blocking
- 🔔 Warning notifications

## Installation

### Development

```bash
# Install dependencies
npm install

# Build extension
npm run build

# Load in Chrome
1. Open chrome://extensions/
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist` folder
```

### Production

```bash
npm run build
# Package dist/ folder as ZIP for Chrome Web Store
```

## Project Structure

```
extension-react/
├── src/
│   ├── popup/
│   │   ├── Popup.jsx           # Main popup component
│   │   ├── popup.html          # Popup HTML
│   │   ├── popup.jsx           # Popup entry point
│   │   ├── popup.css           # Popup styles
│   │   └── components/
│   │       ├── StatusCard.jsx
│   │       ├── SettingsPanel.jsx
│   │       ├── CurrentPageScan.jsx
│   │       └── QuickStats.jsx
│   ├── background/
│   │   └── background.js       # Service worker
│   └── content/
│       └── content.js          # Content script
├── manifest.json               # Extension manifest
├── vite.config.js             # Vite configuration
└── package.json               # Dependencies
```

## Components

### Popup
- **StatusCard** - Shows protection status
- **SettingsPanel** - Configure extension settings
- **CurrentPageScan** - Scan active tab
- **QuickStats** - Display user statistics

### Background
- URL monitoring
- Automatic scanning
- Threat blocking
- Statistics tracking

### Content
- Warning overlay for phishing sites
- Page interaction monitoring

## Configuration

### API Endpoint

Update `API_BASE_URL` in `src/background/background.js`:

```js
const API_BASE_URL = 'http://localhost:8000'
```

### Settings

Users can configure:
- Enable/disable protection
- Block phishing sites automatically
- Show warning notifications

## Technologies

- React 18
- Vite
- Tailwind CSS
- Framer Motion
- Lucide React Icons
- Chrome Extension Manifest V3

## License

MIT
