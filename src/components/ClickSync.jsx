import { useEffect, useRef, useCallback, useState } from "react";
import { debounce } from "lodash";

export default function ClickSync({ iframeRef, roomId, userId }) {
  const socketRef = useRef(null);
  const lastUrlRef = useRef("");
  const clickListenerRef = useRef(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const connectWebSocket = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      return;
    }

    const ws = new WebSocket("https://1612-14-52-239-67.ngrok-free.app");

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "joinRoom", roomId, userId }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "roomJoined") {
        updateIframeUrl(data.url);
      } else if (data.type === "urlChange") {
        if (data.userId !== userId) {
          updateIframeUrl(data.url);
        }
      } else if (data.type === "clickEvent") {
        if (data.userId !== userId && !isSimulating) {
          simulateClick(data);
        }
      }
    };

    socketRef.current = ws;
  }, [roomId, userId, isSimulating]);

  useEffect(() => {
    connectWebSocket();

    const reconnectInterval = setInterval(() => {
      if (!socketRef.current || socketRef.current.readyState === WebSocket.CLOSED) {
        connectWebSocket();
      }
    }, 5000);

    return () => {
      clearInterval(reconnectInterval);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connectWebSocket]);

  function handleClick(event) {
    if (event.detail && event.detail.isSimulated) {
      return;
    }

    if (isSimulating) return;

    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument) return;

    const relativeX = event.clientX / iframe.clientWidth;
    const relativeY = event.clientY / iframe.clientHeight;

    const clickData = {
      type: "clickEvent",
      roomId,
      userId,
      relativeX,
      relativeY,
      iframeWidth: iframe.clientWidth,
      iframeHeight: iframe.clientHeight,
    };

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(clickData));
    }
  }

  const simulateClick = useCallback(
    (data) => {
      if (data.userId === userId || isSimulating) return;
      const iframe = iframeRef.current;
      if (!iframe || !iframe.contentDocument) return;

      setIsSimulating(true);

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

      setIsSimulating(false);
    },
    [userId],
  );

  function addClickMarker(doc, x, y) {
    const marker = doc.createElement("div");
    marker.style.position = "absolute";
    marker.style.width = "10px";
    marker.style.height = "10px";
    marker.style.backgroundColor = "#83b4ff";
    marker.style.borderRadius = "50%";
    marker.style.left = `${x}px`;
    marker.style.top = `${y}px`;
    marker.style.zIndex = 1000;
    doc.body.appendChild(marker);

    setTimeout(() => {
      marker.remove();
    }, 300);
  }

  function updateIframeUrl(url) {
    const iframe = iframeRef.current;

    if (iframe && iframe.src !== url) {
      iframe.src = url;
    }
  }

  const handleUrlChange = useCallback(
    debounce(() => {
      const iframe = iframeRef.current;
      if (!iframe || !iframe.contentWindow) return;

      const newUrl = iframe.contentWindow.location.href;
      if (newUrl === lastUrlRef.current) return;

      lastUrlRef.current = newUrl;

      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        const message = JSON.stringify({
          type: "urlChange",
          roomId,
          userId,
          url: newUrl,
        });
        socketRef.current.send(message);
      }
    }, 300),
    [roomId, userId],
  );

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const addClickListener = () => {
      if (clickListenerRef.current) {
        iframe.contentDocument.removeEventListener("click", clickListenerRef.current);
      }
      clickListenerRef.current = handleClick;
      iframe.contentDocument.addEventListener("click", clickListenerRef.current);
    };

    const handleIframeLoad = () => {
      addClickListener();

      if (iframe.contentWindow) {
        iframe.contentWindow.addEventListener("popstate", handleUrlChange);

        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === "childList") {
              handleUrlChange();
            }
          });
        });

        observer.observe(iframe.contentDocument.body, {
          childList: true,
          subtree: true,
        });

        return () => {
          iframe.contentWindow.removeEventListener("popstate", handleUrlChange);
          observer.disconnect();
        };
      }
    };

    iframe.addEventListener("load", handleIframeLoad);

    if (iframe.contentDocument && iframe.contentDocument.readyState === "complete") {
      handleIframeLoad();
    }

    return () => {
      iframe.removeEventListener("load", handleIframeLoad);
      if (iframe.contentDocument && clickListenerRef.current) {
        iframe.contentDocument.removeEventListener("click", clickListenerRef.current);
      }
      if (iframe.contentWindow) {
        iframe.contentWindow.removeEventListener("popstate", handleUrlChange);
      }
    };
  }, [handleClick, handleUrlChange]);

  return null;
}
