# BerryPeek

> Preview links in an elegant overlay with Shift+Click, inspired by Arc browser's Peek feature.

![Browser Chrome](https://img.shields.io/badge/browser-Chrome-green) ![Browser Dia](https://img.shields.io/badge/browser-Dia-green)

## ✨ Features

- **Quick Preview**: Hold `Shift` and click any link to preview it in a beautiful overlay
- **Arc-Inspired Design**: Elegant and modern UI inspired by [Arc browser's Peek feature](https://resources.arc.net/hc/en-us/articles/19335302900887-Peek-Preview-Sites-From-Pinned-Tabs)
- **Seamless Integration**: Works on any webpage without interrupting your workflow
- **Smart Frame Detection**: Automatically detects `X-Frame-Options` headers and opens links in new tabs when iframe embedding is restricted
- **Easy Navigation**: 
  - Refresh the preview
  - Open in new tab
  - Copy link
  - Close overlay

## 🚀 Installation

### Quick Install (Recommended)

1. Go to the [Releases page](https://github.com/Kain-90/BerryPeek/releases) or download the latest zip file directly from the repository
2. Download the latest `chrome-*.zip` file
3. Open Chrome and navigate to `chrome://extensions/`
4. Enable "Developer mode" in the top right corner
5. Click "Load unpacked" and select the downloaded zip file (you may need to extract it first)
6. The extension is now installed! 🎉

### From Source

1. Clone this repository:
   ```bash
   git clone https://github.com/Kain-90/BerryPeek.git
   cd BerryPeek
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" in the top right corner

4. Click "Load unpacked" and select the `chrome` directory from this project

5. The extension is now installed! 🎉

## 🎯 Usage

1. Navigate to any webpage
2. Hold down the `Shift` key
3. Click on any link
4. A preview overlay will appear showing the linked page
5. Use the toolbar to:
   - 🔄 Refresh the preview
   - 🔗 Open in a new tab
   - ✓ Copy the link
   - ✕ Close the overlay

## 🏗️ Project Structure

```
chrome/
├── manifest.json       # Extension configuration
├── background.js       # Background service worker
├── content.js          # Content script for link detection
├── content.css         # Content script styles
├── iframe.html         # Preview overlay template
├── iframe.js           # Preview overlay logic
├── iframe.css          # Preview overlay styles
├── rules.json          # Network rules for iframe loading
└── static/             # Icons and assets
```

## 💡 Inspiration

This extension brings the beloved [Peek feature from Arc browser](https://resources.arc.net/hc/en-us/articles/19335302900887-Peek-Preview-Sites-From-Pinned-Tabs) to Chrome and other Chromium-based browsers. Arc's Peek allows you to quickly preview links without leaving your current page, and we wanted to make this productivity boost available to everyone.

## 🔒 X-Frame-Options Handling

BerryPeek intelligently handles websites that restrict iframe embedding through `X-Frame-Options` headers:

- **X-Frame-Options: deny** - Links are automatically opened in a new tab
- **X-Frame-Options: sameorigin** - Links are checked against the current page's origin:
  - Same origin: Opens in preview overlay
  - Different origin: Opens in a new tab
- **No restriction** - Opens in preview overlay as normal

This ensures a smooth user experience without security warnings or failed previews.

## 🤝 Contributing

Contributions are welcome! Feel free to:

- Report bugs
- Suggest new features
- Submit pull requests

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Inspired by [The Browser Company](https://arc.net/) and their innovative Arc browser
- Built for users who love efficient browsing experiences

