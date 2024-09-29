import { useEffect, useRef, useCallback } from "react";
import { useAtom } from "jotai";
import { debounce } from "lodash";

import { roomIdAtom, userIdAtom } from "../atoms/atoms";
import useWebSocket from "./useWebSocket";

export default function useClickSync(iframeRef) {
  const [roomId] = useAtom(roomIdAtom);
  const [userId] = useAtom(userIdAtom);
  const { sendMessage, setOnMessage } = useWebSocket();

  const lastUrlRef = useRef("");
  const isSimulatingRef = useRef(false);
  const isUpdatingUrlRef = useRef(false);
  const urlChangeTimeoutRef = useRef(null);

  function handleMessage(data) {
    switch (data.type) {
      case "roomJoined":
      case "urlChange":
        updateIframeUrl(data.url);
        break;
      case "clickEvent":
        simulateClick(data);
        break;
    }
  }

  useEffect(() => {
    setOnMessage((event) => {
      const data = JSON.parse(event.data);
      handleMessage(data);
    });
  }, [setOnMessage, handleMessage]);

  const handleClick = useCallback(
    (event) => {
      if (event.detail?.isSimulated || isSimulatingRef.current || isUpdatingUrlRef.current) return;

      const iframe = iframeRef.current;
      if (!iframe || !iframe.contentDocument) return;

      const relativeX = event.clientX / iframe.clientWidth;
      const relativeY = event.clientY / iframe.clientHeight;

      if (urlChangeTimeoutRef.current) {
        clearTimeout(urlChangeTimeoutRef.current);
      }

      urlChangeTimeoutRef.current = setTimeout(() => {
        sendMessage({
          type: "clickEvent",
          roomId,
          userId,
          relativeX,
          relativeY,
          iframeWidth: iframe.clientWidth,
          iframeHeight: iframe.clientHeight,
        });
        urlChangeTimeoutRef.current = null;
      }, 500);
    },
    [sendMessage, roomId, userId],
  );

  const simulateClick = useCallback((data) => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument || isSimulatingRef.current || isUpdatingUrlRef.current)
      return;

    isSimulatingRef.current = true;

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

    isSimulatingRef.current = false;
  }, []);

  const addClickMarker = (doc, x, y) => {
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
    setTimeout(() => marker.remove(), 300);
  };

  const updateIframeUrl = useCallback((url) => {
    const iframe = iframeRef.current;
    if (iframe && iframe.src !== url && !isUpdatingUrlRef.current) {
      isUpdatingUrlRef.current = true;
      iframe.src = url;
      lastUrlRef.current = url;

      if (urlChangeTimeoutRef.current) {
        clearTimeout(urlChangeTimeoutRef.current);
        urlChangeTimeoutRef.current = null;
      }

      setTimeout(() => {
        isUpdatingUrlRef.current = false;
      }, 1000);
    }
  }, []);

  const handleUrlChange = useCallback(
    debounce(() => {
      const iframe = iframeRef.current;
      if (!iframe || !iframe.contentWindow || isUpdatingUrlRef.current) return;

      const newUrl = iframe.contentWindow.location.href;
      if (newUrl === lastUrlRef.current) return;

      lastUrlRef.current = newUrl;

      sendMessage({
        type: "urlChange",
        roomId,
        userId,
        url: newUrl,
      });

      if (urlChangeTimeoutRef.current) {
        clearTimeout(urlChangeTimeoutRef.current);
        urlChangeTimeoutRef.current = null;
      }

      isUpdatingUrlRef.current = true;
      setTimeout(() => {
        isUpdatingUrlRef.current = false;
      }, 1000);
    }, 300),
    [roomId, userId, sendMessage],
  );

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleIframeLoad = () => {
      iframe.contentDocument.addEventListener("click", handleClick);

      if (iframe.contentWindow) {
        iframe.contentWindow.addEventListener("popstate", handleUrlChange);

        const observer = new MutationObserver(() => {
          if (!isUpdatingUrlRef.current) {
            handleUrlChange();
          }
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
    };

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
  }, [handleClick, handleUrlChange]);
}
