// When the extension is installed, create the context menu.
chrome.runtime.onInstalled.addListener(() => {
  // Create a context menu item for links.
  chrome.contextMenus.create({
    id: "peekLink",
    title: "Peek link preview",
    contexts: ["link"]
  });
});

// Handle clicks on the context menu item.
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "peekLink" && info.linkUrl) {
    // Send message to content script to show peek window
    chrome.tabs.sendMessage(tab.id, {
      type: "showPeek",
      url: info.linkUrl
    });
  }
});
