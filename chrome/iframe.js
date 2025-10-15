// Request URL from parent window
window.parent.postMessage('requestURL', '*');

// Keep reference to current iframe and URL
let currentIframe = null;
let currentUrl = '';

// Function to create/recreate iframe
function createIframe(url) {
  // Remove existing iframe if any
  if (currentIframe) {
    currentIframe.remove();
  }
  
  // Clear any existing error messages
  const errorContainer = document.querySelector('.iframe-error');
  if (errorContainer) {
    errorContainer.remove();
  }
  
  currentUrl = url;
  const iframe = document.createElement('iframe');
  currentIframe = iframe;
  let hasLoaded = false;
  
  // Detect if iframe fails to load (timeout)
  const timeout = setTimeout(function() {
    // If iframe hasn't loaded after 10 seconds, assume it's blocked or failed
    if (!hasLoaded) {
      showError(url);
      iframe.remove();
      currentIframe = null;
      window.parent.postMessage({ type: 'iframeLoaded', success: false }, '*');
    }
  }, 10000);
  
  // Handle successful load
  iframe.onload = function() {
    hasLoaded = true;
    clearTimeout(timeout);
    window.parent.postMessage({ type: 'iframeLoaded', success: true }, '*');
  };
  
  iframe.src = url;
  document.body.appendChild(iframe);
}

// Receive URL and create iframe
window.addEventListener('message', function(event) {
  // Handle refresh command
  if (event.data && event.data.type === 'refresh') {
    if (currentUrl) {
      createIframe(currentUrl);
    }
    return;
  }
  
  // Handle URL message
  if (typeof event.data === 'string' && event.data.startsWith('http')) {
    createIframe(event.data);
  }
});

// Show error message when iframe is blocked
function showError(url) {
  const errorContainer = document.createElement('div');
  errorContainer.className = 'iframe-error';
  
  const icon = document.createElement('div');
  icon.className = 'iframe-error-icon';
  icon.textContent = '🔒';
  
  const title = document.createElement('h2');
  title.className = 'iframe-error-title';
  title.textContent = 'Cannot Preview This Page';
  
  const message = document.createElement('p');
  message.className = 'iframe-error-message';
  message.textContent = 'This page failed to load in the preview. It may have additional protection or network issues.';
  
  const urlDisplay = document.createElement('div');
  urlDisplay.className = 'iframe-error-url';
  urlDisplay.textContent = url;
  
  const button = document.createElement('button');
  button.className = 'iframe-error-button';
  button.textContent = 'Open in New Tab';
  button.onclick = () => {
    window.parent.postMessage({ type: 'openInNewTab', url: url }, '*');
  };
  
  errorContainer.appendChild(icon);
  errorContainer.appendChild(title);
  errorContainer.appendChild(message);
  errorContainer.appendChild(urlDisplay);
  errorContainer.appendChild(button);
  
  document.body.appendChild(errorContainer);
}

