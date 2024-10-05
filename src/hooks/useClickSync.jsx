import { useEffect, useRef } from "react";
import { useAtom } from "jotai";

import { roomIdAtom, userIdAtom } from "../atoms/atoms";
import useWebSocket from "./useWebSocket";

export default function useClickSync(iframeRef) {
  const [roomId] = useAtom(roomIdAtom);
  const [userId] = useAtom(userIdAtom);
  const { sendMessage, setOnMessage } = useWebSocket();

  const lastUrlRef = useRef("");

  function handleMessage(data) {
    switch (data.type) {
      case "roomJoined":
      case "urlChange":
        if (data.url !== lastUrlRef.current) {
          updateIframeUrl(data.url);
        }
        break;
      case "clickEvent":
        simulateClick(data);
        break;
      default:
        break;
    }
  }

  function handleClick(event) {
    if (event.detail.isSimulated) return;

    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument) return;

    const relativeX = event.clientX / iframe.clientWidth;
    const relativeY = event.clientY / iframe.clientHeight;

    sendMessage({
      type: "clickEvent",
      roomId,
      userId,
      relativeX,
      relativeY,
      iframeWidth: iframe.clientWidth,
      iframeHeight: iframe.clientHeight,
    });
  }

  function handleUrlChange() {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;

    const newUrl = iframe.contentWindow.location.href;
    if (newUrl === lastUrlRef.current) return;

    lastUrlRef.current = newUrl;

    sendMessage({
      type: "urlChange",
      roomId,
      userId,
      url: newUrl,
    });
  }

  function simulateClick(data) {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument) return;

    const widthRatio = iframe.clientWidth / data.iframeWidth;
    const heightRatio = iframe.clientHeight / data.iframeHeight;

    const clickX = data.relativeX * data.iframeWidth * widthRatio;
    const clickY = data.relativeY * data.iframeHeight * heightRatio;

    const clickEvent = new CustomEvent("click", {
      bubbles: true,
      cancelable: true,
      detail: { isSimulated: true, clientX: clickX, clientY: clickY },
    });

    const element = iframe.contentDocument.elementFromPoint(clickX, clickY);
    if (element) {
      element.dispatchEvent(clickEvent);
    }

    addClickMarker(iframe.contentDocument, clickX, clickY);
  }

  function updateIframeUrl(url) {
    const iframe = iframeRef.current;
    if (iframe && iframe.src !== url) {
      iframe.src = url;
      lastUrlRef.current = url;
    }
  }

  function addClickMarker(doc, x, y) {
    const marker = doc.createElement("div");

    Object.assign(marker.style, {
      position: "absolute",
      width: "10px",
      height: "10px",
      backgroundColor: "#83b4ff",
      borderRadius: "50%",
      left: `${x}px`,
      top: `${y}px`,
      zIndex: "1000",
    });

    doc.body.appendChild(marker);

    setTimeout(() => {
      marker.remove();
    }, 300);
  }

  useEffect(() => {
    setOnMessage((event) => {
      const data = JSON.parse(event.data);
      handleMessage(data);
    });

    const iframe = iframeRef.current;
    if (!iframe) return;

    function handleIframeLoad() {
      iframe.contentDocument.addEventListener("click", handleClick);

      if (iframe.contentWindow) {
        iframe.contentWindow.addEventListener("popstate", handleUrlChange);

        const observer = new MutationObserver(() => {
          handleUrlChange();
        });
        observer.observe(iframe.contentDocument.body, {
          childList: true,
          subtree: true,
        });
        handleUrlChange();

        return () => {
          iframe.contentWindow.removeEventListener("popstate", handleUrlChange);
          observer.disconnect();
        };
      }
    }

    iframe.addEventListener("load", handleIframeLoad);

    return () => {
      iframe.removeEventListener("load", handleIframeLoad);
      if (iframe.contentDocument) {
        iframe.contentDocument.removeEventListener("click", handleClick);
      }
      if (iframe.contentWindow) {
        iframe.contentWindow.removeEventListener("popstate", handleUrlChange);
      }
    };
  }, [setOnMessage]);
}
