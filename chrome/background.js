BLOCK_DOMAINS = ["t.co"];

// Check frame restrictions for URLs
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "checkFrameRestriction") {
    const url = request.url;
    const parentUrl = request.parentUrl;

    const urlHostname = new URL(url).hostname;

    if (BLOCK_DOMAINS.some((domain) => urlHostname === domain)) {
      sendResponse({
        blocked: true,
        reason: "blocked short URL",
      });
      return;
    }

    // Check X-Frame-Options header with HEAD request
    // Note: Fetch only rejects on network errors, not HTTP errors
    fetch(url, { method: "HEAD", mode: "no-cors" })
      .then((response) => {
        // no-cors mode: response is opaque, but headers are still accessible
        if (!response.ok) {
          sendResponse({
            blocked: true,
            reason: "HTTP error: " + response.status,
          });
          return;
        }

        // Get X-Frame-Options header
        const xFrameOptions = response.headers.get("X-Frame-Options");

        if (!xFrameOptions) {
          // No X-Frame-Options - allow embedding
          sendResponse({
            blocked: false,
            reason: "No X-Frame-Options header",
          });
          return;
        }

        const xFrameOptionsValue = xFrameOptions.toLowerCase();

        if (xFrameOptionsValue.includes("deny")) {
          // X-Frame-Options: deny - block
          sendResponse({
            blocked: true,
            reason: "X-Frame-Options: deny",
          });
        } else if (xFrameOptionsValue.includes("sameorigin")) {
          // X-Frame-Options: sameorigin - check origins match
          try {
            const linkOrigin = new URL(url).origin;
            const parentOrigin = new URL(parentUrl).origin;

            if (linkOrigin !== parentOrigin) {
              sendResponse({
                blocked: true,
                reason: "X-Frame-Options: sameorigin - different origins",
              });
            } else {
              sendResponse({
                blocked: false,
                reason: "X-Frame-Options: sameorigin - same origin",
              });
            }
          } catch (e) {
            sendResponse({
              blocked: false,
              reason: "URL parsing error",
            });
          }
        } else {
          // Other X-Frame-Options values - allow
          sendResponse({
            blocked: false,
            reason: "X-Frame-Options: " + xFrameOptionsValue,
          });
        }
      })
      .catch((error) => {
        // Network error - block to be safe
        sendResponse({
          blocked: true,
          reason: "Network error: " + error.message,
        });
      });

    // Respond asynchronously
    return true;
  }
});
