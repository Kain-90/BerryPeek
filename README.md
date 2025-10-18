<div align="center">
  <img src="https://raw.githubusercontent.com/Kain-90/BerryPeek/975101353d1a8f73a45bc90b1dfbaf0030ebaa3d/chrome/static/icon.png" alt="BerryPeek Logo" width="120" height="120">
</div>

<h1 align="center">BerryPeek</h1>

> Preview links in an elegant overlay with Shift+Click, inspired by Arc browser's Peek feature.

## 🌐 Supported Browsers

BerryPeek works with all **Chromium-based browsers** including:

![Chrome](https://img.shields.io/badge/Chrome-4285F4?logo=googlechrome&logoColor=white) ![Arc](https://img.shields.io/badge/Arc-000000?logo=arc&logoColor=white) ![Commet](https://img.shields.io/badge/Comet-000000?logoColor=white) ![Microsoft Edge](https://img.shields.io/badge/Microsoft%20Edge-0078D4?logo=microsoftedge&logoColor=white) ![Opera](https://img.shields.io/badge/Opera-FF1B2D?logo=opera&logoColor=white) ![Brave](https://img.shields.io/badge/Brave-FB542B?logo=brave&logoColor=white)

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

### Chrome Web Store (Easiest)

[![Install from Chrome Web Store](https://img.shields.io/badge/Install%20from-Chrome%20Web%20Store-blue?logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/detail/berrypeek-link-preview-qu/acefdkhifcfklkfobgocedlokcjkchgn)

1. Click the badge above or visit the [Chrome Web Store page](https://chromewebstore.google.com/detail/berrypeek-link-preview-qu/acefdkhifcfklkfobgocedlokcjkchgn)
2. Click **"Add to Chrome"**
3. Confirm the installation
4. The extension is ready to use! 🎉

### Manual Installation (For Other Browsers)

1. Go to the [Releases page](https://github.com/Kain-90/BerryPeek/releases)
2. Download the latest `chrome-*.zip` file
3. Open your browser and navigate to the extensions page:
   - **Chrome**: `chrome://extensions/`
   - **Edge**: `edge://extensions/`
   - **Opera**: `opera://extensions/`
4. Enable "Developer mode" in the top right corner
5. Click "Load unpacked" and select the downloaded zip file (extract it first if needed)
6. The extension is now installed! 🎉

### From Source (For Developers)

1. Clone this repository:
   ```bash
   git clone https://github.com/Kain-90/BerryPeek.git
   cd BerryPeek
   ```

2. Open your browser and navigate to the extensions page:
   - **Chrome**: `chrome://extensions/`
   - **Edge**: `edge://extensions/`
   - **Opera**: `opera://extensions/`

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

