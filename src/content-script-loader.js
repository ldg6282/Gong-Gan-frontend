const script = document.createElement("script");
script.src = chrome.runtime.getURL("content.js");
script.type = "module";
script.onload = () => {
  window.postMessage({ type: "FROM_CONTENT_SCRIPT", action: "initContent" }, "*");
};

(document.head || document.documentElement).appendChild(script);
