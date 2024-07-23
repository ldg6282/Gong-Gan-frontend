let isExtensionActive = false;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggleExtension") {
    isExtensionActive = request.status;
    sendResponse({ status: isExtensionActive });
  }

  if (request.action === "checkExtensionActive") {
    sendResponse({ isActive: isExtensionActive });
  }

  if (request.action === "initContent") {
    if (isExtensionActive) {
      chrome.scripting.executeScript({
        target: { tabId: sender.tab.id },
        files: ["content.js"],
      });
    }
  }

  if (request.action === "contentScriptLoaded") {
    isExtensionActive = false;
  }
});
