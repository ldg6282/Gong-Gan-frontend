let isExtensionActive = false;
let currentRoomId = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggleExtension") {
    isExtensionActive = request.status;
    sendResponse({ status: isExtensionActive });
  } else if (request.action === "checkExtensionActive") {
    sendResponse({ isActive: isExtensionActive });
  } else if (request.action === "getRoomId") {
    sendResponse({ roomId: currentRoomId });
  } else if (request.action === "setRoomId") {
    currentRoomId = request.roomId;
    sendResponse({ success: true });
  } else if (request.action === "contentScriptLoaded") {
    isExtensionActive = false;
    currentRoomId = null;
  } else {
    sendResponse({ error: "Unknown action" });
  }

  return true;
});
