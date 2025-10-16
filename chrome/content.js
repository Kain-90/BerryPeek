(function () {
  let currentPeekWindow = null;

  // Theme management
  const THEME_STORAGE_KEY = "berrypeek_theme";
  let currentTheme = "auto"; // auto, light, dark
  let systemPrefersDark = false;

  // Initialize theme system
  function initTheme() {
    // Load saved theme preference
    chrome.storage.sync.get([THEME_STORAGE_KEY], (result) => {
      currentTheme = result[THEME_STORAGE_KEY] || "auto";
    });

    // Setup system theme detection
    const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    systemPrefersDark = darkModeQuery.matches;

    // Listen for system theme changes
    darkModeQuery.addEventListener("change", (e) => {
      systemPrefersDark = e.matches;
      if (currentTheme === "auto" && currentPeekWindow) {
        applyThemeToWindow(currentPeekWindow.shadowRoot);
        // No need to update icon for auto mode as it stays the same
      }
    });
  }

  // Get effective theme (resolve 'auto' to light/dark)
  function getEffectiveTheme() {
    if (currentTheme === "auto") {
      return systemPrefersDark ? "dark" : "light";
    }
    return currentTheme;
  }

  // Apply theme to shadow root
  function applyThemeToWindow(shadowRoot) {
    const effectiveTheme = getEffectiveTheme();
    const overlay = shadowRoot.querySelector("#berrypeek-overlay");
    if (overlay) {
      overlay.setAttribute("data-theme", effectiveTheme);
    }

    // Send theme to iframe
    const iframe = shadowRoot.querySelector(".berrypeek-iframe-wrapper iframe");
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(
        {
          type: "setTheme",
          theme: effectiveTheme,
        },
        "*"
      );
    }
  }

  // Save theme preference
  function saveTheme(theme) {
    currentTheme = theme;
    chrome.storage.sync.set({ [THEME_STORAGE_KEY]: theme });
    if (currentPeekWindow) {
      applyThemeToWindow(currentPeekWindow.shadowRoot);
      updateThemeButtonIcon(currentPeekWindow.shadowRoot);
    }
  }

  // Get theme icon based on current theme
  function getThemeIcon(theme) {
    const icons = {
      auto: chrome.runtime.getURL("static/theme-auto.svg"),
      light: chrome.runtime.getURL("static/theme-light.svg"),
      dark: chrome.runtime.getURL("static/theme-dark.svg"),
    };
    return icons[theme] || icons["auto"];
  }

  // Update theme button icon
  function updateThemeButtonIcon(shadowRoot) {
    const themeIcon = shadowRoot.querySelector(".berrypeek-theme-button img");
    if (themeIcon) {
      themeIcon.src = getThemeIcon(currentTheme);
    }
  }

  // Initialize theme on load
  initTheme();

  // More robust link detection
  function findLinkElement(element) {
    while (element && element !== document.body) {
      if (element.tagName?.toLowerCase() === "a") return element;
      element = element.parentElement;
    }
    return null;
  }

  // Check if URL has frame restrictions and handle accordingly
  function checkFrameRestrictionAndPeek(url, linkElement) {
    // Check with background script if this URL has frame restrictions
    chrome.runtime.sendMessage(
      {
        type: "checkFrameRestriction",
        url: url,
        parentUrl: window.location.href,
      },
      (response) => {
        if (response && response.blocked) {
          // If blocked, open in new tab instead
          window.open(url, "_blank");
        } else {
          // No restriction, show peek window
          createPeekWindow(url);
        }
      }
    );
  }

  // Create peek window with iframe
  function createPeekWindow(url) {
    // Close existing peek window if any
    if (currentPeekWindow) {
      closePeekWindow();
    }

    // Create shadow host container
    const shadowHost = document.createElement("div");
    shadowHost.id = "berrypeek-shadow-host";

    // Set critical styles on shadow host to ensure it's visible and positioned correctly
    shadowHost.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      z-index: 2147483647 !important;
      pointer-events: auto !important;
    `;

    // Attach shadow DOM for style isolation
    const shadowRoot = shadowHost.attachShadow({ mode: "open" });

    // Load CSS into shadow DOM
    const style = document.createElement("link");
    style.rel = "stylesheet";
    style.href = chrome.runtime.getURL("content.css");
    shadowRoot.appendChild(style);

    // Create overlay
    const overlay = document.createElement("div");
    overlay.id = "berrypeek-overlay";

    // Create wrapper for container and buttons
    const wrapper = document.createElement("div");
    wrapper.className = "berrypeek-wrapper";

    // Create container
    const container = document.createElement("div");
    container.id = "berrypeek-container";

    // Create header
    const header = document.createElement("div");
    header.className = "berrypeek-header";

    // Header buttons container
    const headerButtons = document.createElement("div");
    headerButtons.className = "berrypeek-header-buttons";

    // Refresh button
    const refreshButton = document.createElement("button");
    refreshButton.className = "berrypeek-header-button";
    refreshButton.title = "Refresh";
    const refreshIcon = document.createElement("img");
    refreshIcon.src = chrome.runtime.getURL("static/refresh.svg");
    refreshIcon.alt = "Refresh";
    refreshButton.appendChild(refreshIcon);

    // Store iframe reference for refresh
    let mainIframe = null;

    refreshButton.onclick = (e) => {
      e.stopPropagation();

      // Add rotation animation
      refreshIcon.style.animation = "berrypeek-spin 0.5s ease-in-out";
      setTimeout(() => {
        refreshIcon.style.animation = "";
      }, 500);

      // Send refresh command to iframe
      if (mainIframe && mainIframe.contentWindow) {
        mainIframe.contentWindow.postMessage({ type: "refresh" }, "*");
      }
    };

    // Copy link button
    const copyButton = document.createElement("button");
    copyButton.className = "berrypeek-header-button";
    copyButton.title = "Copy link";
    const linkIcon = document.createElement("img");
    linkIcon.src = chrome.runtime.getURL("static/link.svg");
    linkIcon.alt = "Copy link";
    copyButton.appendChild(linkIcon);
    copyButton.onclick = (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(url).then(() => {
        // Visual feedback
        linkIcon.src = chrome.runtime.getURL("static/check.svg");
        setTimeout(() => {
          linkIcon.src = chrome.runtime.getURL("static/link.svg");
        }, 1000);
      });
    };

    // Theme button container
    const themeContainer = document.createElement("div");
    themeContainer.className = "berrypeek-theme-container";

    // Theme button
    const themeButton = document.createElement("button");
    themeButton.className = "berrypeek-header-button berrypeek-theme-button";
    themeButton.title =
      "Theme: " + currentTheme.charAt(0).toUpperCase() + currentTheme.slice(1);
    const themeIcon = document.createElement("img");
    themeIcon.src = getThemeIcon(currentTheme);
    themeIcon.alt = "Theme";
    themeButton.appendChild(themeIcon);

    // Theme dropdown
    const themeDropdown = document.createElement("div");
    themeDropdown.className = "berrypeek-theme-dropdown";

    const themeOptions = [
      { value: "auto", label: "Auto" },
      { value: "light", label: "Light" },
      { value: "dark", label: "Dark" },
    ];

    themeOptions.forEach((option) => {
      const optionButton = document.createElement("button");
      optionButton.className = "berrypeek-theme-option";
      optionButton.textContent = option.label;
      optionButton.onclick = (e) => {
        e.stopPropagation();
        saveTheme(option.value);
        themeDropdown.classList.remove("show");
        themeButton.title = "Theme: " + option.label;
        // Update checkmarks
        themeDropdown
          .querySelectorAll(".berrypeek-theme-option")
          .forEach((btn) => {
            btn.classList.remove("active");
          });
        optionButton.classList.add("active");
      };
      if (option.value === currentTheme) {
        optionButton.classList.add("active");
      }
      themeDropdown.appendChild(optionButton);
    });

    themeButton.onclick = (e) => {
      e.stopPropagation();
      themeDropdown.classList.toggle("show");
    };

    // Close dropdown when clicking outside
    overlay.addEventListener("click", () => {
      themeDropdown.classList.remove("show");
    });

    themeContainer.appendChild(themeButton);
    themeContainer.appendChild(themeDropdown);

    headerButtons.appendChild(refreshButton);
    headerButtons.appendChild(copyButton);
    headerButtons.appendChild(themeContainer);

    // URL display
    const urlDisplay = document.createElement("div");
    urlDisplay.className = "berrypeek-url";
    urlDisplay.textContent = url;

    header.appendChild(headerButtons);
    header.appendChild(urlDisplay);

    // Button container (outside of header)
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "berrypeek-buttons";

    // Open in new tab button
    const openButton = document.createElement("button");
    openButton.className = "berrypeek-button berrypeek-button-open";
    openButton.title = "Open in new tab";
    const openIcon = document.createElement("img");
    openIcon.src = chrome.runtime.getURL("static/open.svg");
    openIcon.alt = "Open";
    openButton.appendChild(openIcon);
    openButton.onclick = (e) => {
      e.stopPropagation();
      window.open(url, "_blank");
      closePeekWindow();
    };

    // Close button
    const closeButton = document.createElement("button");
    closeButton.className = "berrypeek-button berrypeek-button-close";
    closeButton.title = "Close (Esc)";
    const closeIcon = document.createElement("img");
    closeIcon.src = chrome.runtime.getURL("static/close.svg");
    closeIcon.alt = "Close";
    closeButton.appendChild(closeIcon);
    closeButton.onclick = (e) => {
      e.stopPropagation();
      closePeekWindow();
    };

    buttonContainer.appendChild(openButton);
    buttonContainer.appendChild(closeButton);

    // Create iframe wrapper
    const iframeWrapper = document.createElement("div");
    iframeWrapper.className = "berrypeek-iframe-wrapper";

    // Create iframe
    const iframe = document.createElement("iframe");
    iframe.src = chrome.runtime.getURL("iframe.html");
    mainIframe = iframe; // Store reference for refresh button

    // Listen for messages from iframe
    const onMessage = function (event) {
      if (event.source === iframe.contentWindow) {
        // Handle URL request
        if (event.data === "requestURL") {
          iframe.contentWindow.postMessage(url, "*");
          // Don't remove listener - we need it for other messages
        }
        // Handle open in new tab request
        else if (event.data && event.data.type === "openInNewTab") {
          window.open(event.data.url, "_blank");
          closePeekWindow();
        }
      }
    };
    window.addEventListener("message", onMessage);

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
      if (e.key === "Escape") {
        closePeekWindow();
      }
    };
    document.addEventListener("keydown", escapeHandler);

    // Append overlay to shadow root
    shadowRoot.appendChild(overlay);

    // Append shadow host to body
    document.body.appendChild(shadowHost);

    // Store reference
    currentPeekWindow = {
      shadowHost,
      shadowRoot,
      escapeHandler,
      messageHandler: onMessage,
    };

    // Apply initial theme and update icon
    applyThemeToWindow(shadowRoot);
    updateThemeButtonIcon(shadowRoot);
  }

  // Close peek window
  function closePeekWindow() {
    if (currentPeekWindow) {
      currentPeekWindow.shadowHost.remove();
      document.removeEventListener("keydown", currentPeekWindow.escapeHandler);
      if (currentPeekWindow.messageHandler) {
        window.removeEventListener("message", currentPeekWindow.messageHandler);
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

    checkFrameRestrictionAndPeek(link.href, link);
  }

  // Listen for messages from background script (context menu)
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "showPeek" && message.url) {
      checkFrameRestrictionAndPeek(message.url, null);
    }
  });

  // Listen for messages from iframe
  window.addEventListener("message", (event) => {
    // Handle iframe requesting current theme
    if (event.data && event.data.type === "requestTheme") {
      const effectiveTheme = getEffectiveTheme();
      event.source.postMessage(
        {
          type: "setTheme",
          theme: effectiveTheme,
        },
        "*"
      );
    }
  });

  // Capture-phase listeners to intercept events early
  document.addEventListener("click", handleLinkClick, true);
  document.addEventListener("auxclick", handleLinkClick, true);
})();
