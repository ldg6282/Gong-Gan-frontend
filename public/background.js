let isExtensionActive = false;
let currentRoomId = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggleExtension") {
    isExtensionActive = request.status;
    sendResponse({ status: isExtensionActive });
    return true;
  }
  if (request.action === "checkExtensionActive") {
    sendResponse({ isActive: isExtensionActive });
    return true;
  }
  if (request.action === "getRoomId") {
    sendResponse({ roomId: currentRoomId });
    return true;
  }
  if (request.action === "setRoomId") {
    currentRoomId = request.roomId;
    sendResponse({ success: true });
    return true;
  }
  if (request.action === "contentScriptLoaded") {
    isExtensionActive = false;
    currentRoomId = null;
    sendResponse({ success: true });
    return true;
  }
  sendResponse({ error: "Unknown action" });
  return true;
});
