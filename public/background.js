chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "initContent") {
    handleInitContent();
  }
});

function handleInitContent() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    if (isValidTab(activeTab)) {
      chrome.tabs.sendMessage(activeTab.id, { action: "initContent" });
    }
  });
}
