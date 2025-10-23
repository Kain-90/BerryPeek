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
    // Show loading state immediately
    createLoadingState(url);

    // Check with background script if this URL has frame restrictions
    chrome.runtime.sendMessage(
      {
        type: "checkFrameRestriction",
        url: url,
        parentUrl: window.location.href,
      },
      (response) => {
        if (response && response.blocked) {
          // If blocked, close loading and open in new tab instead
          closeLoadingState();
          window.open(url, "_blank");
        } else {
          // No restriction, replace loading state with peek window
          closeLoadingState();
          createPeekWindow(url);
        }
      }
    );
  }

  // Create loading state UI
  function createLoadingState(url) {
    // Close existing loading state if any
    if (document.getElementById("berrypeek-loading-host")) {
      closeLoadingState();
    }

    // Create shadow host container
    const shadowHost = document.createElement("div");
    shadowHost.id = "berrypeek-loading-host";

    // Set critical styles on shadow host
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
    overlay.className = "berrypeek-loading-overlay";

    // Create loading container
    const loadingContainer = document.createElement("div");
    loadingContainer.className = "berrypeek-loading-container";

    // Create spinner
    const spinner = document.createElement("div");
    spinner.className = "berrypeek-spinner";

    // Create loading text
    const loadingText = document.createElement("p");
    loadingText.className = "berrypeek-loading-text";
    loadingText.textContent = "Loading preview...";

    loadingContainer.appendChild(spinner);
    loadingContainer.appendChild(loadingText);
    overlay.appendChild(loadingContainer);
    shadowRoot.appendChild(overlay);

    // Append shadow host to body
    document.body.appendChild(shadowHost);

    // Apply theme to loading state
    const effectiveTheme = getEffectiveTheme();
    overlay.setAttribute("data-theme", effectiveTheme);
  }

  // Close loading state
  function closeLoadingState() {
    const loadingHost = document.getElementById("berrypeek-loading-host");
    if (loadingHost) {
      loadingHost.remove();
    }
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

    // Load interact.js library
    const interactScript = document.createElement("script");
    interactScript.src = chrome.runtime.getURL("lib/interact.min.js");
    shadowRoot.appendChild(interactScript);

    // Create overlay
    const overlay = document.createElement("div");
    overlay.id = "berrypeek-overlay";

    // Create wrapper for container and buttons
    const wrapper = document.createElement("div");
    wrapper.className = "berrypeek-wrapper";

    // Create container
    const container = document.createElement("div");
    container.id = "berrypeek-container";

    // Create resize handles
    const resizeHandles = [
      { class: "berrypeek-resize-handle-top", edge: "top" },
      { class: "berrypeek-resize-handle-right", edge: "right" },
      { class: "berrypeek-resize-handle-bottom", edge: "bottom" },
      { class: "berrypeek-resize-handle-left", edge: "left" },
      { class: "berrypeek-resize-handle-top-left", edge: "topLeft" },
      { class: "berrypeek-resize-handle-top-right", edge: "topRight" },
      { class: "berrypeek-resize-handle-bottom-left", edge: "bottomLeft" },
      { class: "berrypeek-resize-handle-bottom-right", edge: "bottomRight" },
    ];

    resizeHandles.forEach((handle) => {
      const handleElement = document.createElement("div");
      handleElement.className = `berrypeek-resize-handle ${handle.class}`;
      handleElement.setAttribute("data-edge", handle.edge);
      container.appendChild(handleElement);
    });

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

    // Initialize interact.js functionality after DOM is ready
    interactScript.onload = () => {
      initializeInteract(shadowRoot, wrapper, container, header);
    };
  }

  // Initialize interact.js functionality
  function initializeInteract(shadowRoot, wrapper, container, header) {
    // Get overlay reference
    const overlay = shadowRoot.querySelector("#berrypeek-overlay");
    // Wait a bit for the script to load and execute
    setTimeout(() => {
      // Try to access interact from the main window context
      const interact = window.interact;
      if (!interact) {
        console.warn("Interact.js not loaded");
        return;
      }

      // Position tracking for wrapper
      const position = { x: 0, y: 0 };

      // Make wrapper draggable via header
      interact(header).draggable({
        listeners: {
          start(event) {
            console.log("Drag started");
          },
          move(event) {
            position.x += event.dx;
            position.y += event.dy;

            wrapper.style.transform = `translate(${position.x}px, ${position.y}px)`;
          },
          end(event) {
            console.log("Drag ended");
          },
        },
        modifiers: [
          // Restrict dragging to viewport bounds
          interact.modifiers.restrict({
            restriction: "parent",
            endOnly: true,
          }),
        ],
      });

      // Get iframe reference for pointer-events control
      const iframe = container.querySelector("iframe");

      // Make container resizable
      interact(container).resizable({
        edges: {
          top:
            ".berrypeek-resize-handle-top, .berrypeek-resize-handle-top-left, .berrypeek-resize-handle-top-right",
          right:
            ".berrypeek-resize-handle-right, .berrypeek-resize-handle-top-right, .berrypeek-resize-handle-bottom-right",
          bottom:
            ".berrypeek-resize-handle-bottom, .berrypeek-resize-handle-bottom-left, .berrypeek-resize-handle-bottom-right",
          left:
            ".berrypeek-resize-handle-left, .berrypeek-resize-handle-top-left, .berrypeek-resize-handle-bottom-left",
        },
        corners: {
          topLeft: ".berrypeek-resize-handle-top-left",
          topRight: ".berrypeek-resize-handle-top-right",
          bottomLeft: ".berrypeek-resize-handle-bottom-left",
          bottomRight: ".berrypeek-resize-handle-bottom-right",
        },
        listeners: {
          start(event) {
            console.log("Resize started");
            // Disable iframe pointer events during resize
            if (iframe) {
              iframe.style.pointerEvents = "none";
            }
            // Temporarily disable overlay click to prevent accidental close during resize
            overlay.style.pointerEvents = "none";
          },
          move(event) {
            // Only update dimensions, don't change position
            Object.assign(container.style, {
              width: `${event.rect.width}px`,
              height: `${event.rect.height}px`,
            });
          },
          end(event) {
            console.log("Resize ended");
            // Re-enable iframe pointer events after resize
            if (iframe) {
              iframe.style.pointerEvents = "auto";
            }
            // Prevent overlay click from closing window after resize
            setTimeout(() => {
              overlay.style.pointerEvents = "auto";
            }, 10);
          },
        },
        modifiers: [
          // Restrict resizing to minimum and maximum dimensions
          interact.modifiers.restrictSize({
            min: { width: 400, height: 300 },
            max: { width: 1400, height: 900 },
          }),
        ],
      });
    }, 100); // Wait 100ms for script to load
  }

  // Close peek window
  function closePeekWindow() {
    if (currentPeekWindow) {
      // Stop any ongoing interactions
      if (window.interact) {
        window.interact.stop();
      }

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

  // Capture-phase listeners to intercept events early
  document.addEventListener("click", handleLinkClick, true);
  document.addEventListener("auxclick", handleLinkClick, true);
})();
