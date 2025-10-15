(function () {
  let currentPeekWindow = null;

  // More robust link detection
  function findLinkElement(element) {
    while (element && element !== document.body) {
      if (element.tagName?.toLowerCase() === 'a') return element;
      element = element.parentElement;
    }
    return null;
  }

  // Create peek window with iframe
  function createPeekWindow(url) {
    // Close existing peek window if any
    if (currentPeekWindow) {
      closePeekWindow();
    }

    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'berrypeek-overlay';

    // Create wrapper for container and buttons
    const wrapper = document.createElement('div');
    wrapper.className = 'berrypeek-wrapper';

    // Create container
    const container = document.createElement('div');
    container.id = 'berrypeek-container';

    // Create header
    const header = document.createElement('div');
    header.className = 'berrypeek-header';

    // Header buttons container
    const headerButtons = document.createElement('div');
    headerButtons.className = 'berrypeek-header-buttons';

    // Refresh button
    const refreshButton = document.createElement('button');
    refreshButton.className = 'berrypeek-header-button';
    refreshButton.title = 'Refresh';
    const refreshIcon = document.createElement('img');
    refreshIcon.src = chrome.runtime.getURL('static/refresh.svg');
    refreshIcon.alt = 'Refresh';
    refreshButton.appendChild(refreshIcon);
    
    // Store iframe reference for refresh
    let mainIframe = null;
    
    refreshButton.onclick = (e) => {
      e.stopPropagation();
      
      // Add rotation animation
      refreshIcon.style.animation = 'berrypeek-spin 0.5s ease-in-out';
      setTimeout(() => {
        refreshIcon.style.animation = '';
      }, 500);
      
      // Send refresh command to iframe
      if (mainIframe && mainIframe.contentWindow) {
        mainIframe.contentWindow.postMessage({ type: 'refresh' }, '*');
      }
    };

    // Copy link button
    const copyButton = document.createElement('button');
    copyButton.className = 'berrypeek-header-button';
    copyButton.title = 'Copy link';
    const linkIcon = document.createElement('img');
    linkIcon.src = chrome.runtime.getURL('static/link.svg');
    linkIcon.alt = 'Copy link';
    copyButton.appendChild(linkIcon);
    copyButton.onclick = (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(url).then(() => {
        // Visual feedback
        linkIcon.src = chrome.runtime.getURL('static/check.svg');
        setTimeout(() => {
          linkIcon.src = chrome.runtime.getURL('static/link.svg');
        }, 1000);
      });
    };

    headerButtons.appendChild(refreshButton);
    headerButtons.appendChild(copyButton);

    // URL display
    const urlDisplay = document.createElement('div');
    urlDisplay.className = 'berrypeek-url';
    urlDisplay.textContent = url;

    header.appendChild(headerButtons);
    header.appendChild(urlDisplay);

    // Button container (outside of header)
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'berrypeek-buttons';

    // Open in new tab button
    const openButton = document.createElement('button');
    openButton.className = 'berrypeek-button berrypeek-button-open';
    openButton.title = 'Open in new tab';
    const openIcon = document.createElement('img');
    openIcon.src = chrome.runtime.getURL('static/open.svg');
    openIcon.alt = 'Open';
    openButton.appendChild(openIcon);
    openButton.onclick = (e) => {
      e.stopPropagation();
      window.open(url, '_blank');
      closePeekWindow();
    };

    // Close button
    const closeButton = document.createElement('button');
    closeButton.className = 'berrypeek-button berrypeek-button-close';
    closeButton.title = 'Close (Esc)';
    const closeIcon = document.createElement('img');
    closeIcon.src = chrome.runtime.getURL('static/close.svg');
    closeIcon.alt = 'Close';
    closeButton.appendChild(closeIcon);
    closeButton.onclick = (e) => {
      e.stopPropagation();
      closePeekWindow();
    };

    buttonContainer.appendChild(openButton);
    buttonContainer.appendChild(closeButton);

    // Create iframe wrapper
    const iframeWrapper = document.createElement('div');
    iframeWrapper.className = 'berrypeek-iframe-wrapper';

    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.src = chrome.runtime.getURL('iframe.html');
    mainIframe = iframe; // Store reference for refresh button

    // Listen for messages from iframe
    const onMessage = function(event) {
      if (event.source === iframe.contentWindow) {
        // Handle URL request
        if (event.data === 'requestURL') {
          iframe.contentWindow.postMessage(url, '*');
          // Don't remove listener - we need it for other messages
        }
        // Handle open in new tab request
        else if (event.data && event.data.type === 'openInNewTab') {
          window.open(event.data.url, '_blank');
          closePeekWindow();
        }
      }
    };
    window.addEventListener('message', onMessage);

    iframeWrapper.appendChild(iframe);
    container.appendChild(header);
    container.appendChild(iframeWrapper);
    wrapper.appendChild(container);
    wrapper.appendChild(buttonContainer);
    overlay.appendChild(wrapper);

    // Close on overlay click
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        closePeekWindow();
      }
    };

    // Close on Escape key
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        closePeekWindow();
      }
    };
    document.addEventListener('keydown', escapeHandler);

    // Store reference
    currentPeekWindow = {
      overlay,
      escapeHandler,
      messageHandler: onMessage
    };

    document.body.appendChild(overlay);
  }

  // Close peek window
  function closePeekWindow() {
    if (currentPeekWindow) {
      currentPeekWindow.overlay.remove();
      document.removeEventListener('keydown', currentPeekWindow.escapeHandler);
      if (currentPeekWindow.messageHandler) {
        window.removeEventListener('message', currentPeekWindow.messageHandler);
      }
      currentPeekWindow = null;
    }
  }

  // Handle link clicks
  function handleLinkClick(e) {
    // Only trigger when Shift key is pressed
    if (!e.shiftKey) return;
    
    // Ignore right-clicks (button === 2)
    if (e.button === 2) return;

    const link = findLinkElement(e.target);
    if (!link?.href) return;

    // Intercept the click and show peek window
    e.preventDefault();
    e.stopImmediatePropagation();

    createPeekWindow(link.href);
  }

  // Listen for messages from background script (context menu)
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'showPeek' && message.url) {
      createPeekWindow(message.url);
    }
  });

  // Capture-phase listeners to intercept events early
  document.addEventListener('click', handleLinkClick, true);
  document.addEventListener('auxclick', handleLinkClick, true);
})();
