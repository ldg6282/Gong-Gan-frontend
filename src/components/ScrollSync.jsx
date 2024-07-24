import { useEffect, useRef, useCallback, useState } from "react";
import { throttle } from "lodash";

const WebSocketURL = "https://aa52-14-52-239-67.ngrok-free.app";
const SCROLL_THRESHOLD = 0.005;

export default function ScrollSync({ iframeRef }) {
  const socketRef = useRef(null);
  const lastScrollPositionRef = useRef({ top: 0, left: 0, verticalRatio: 0, horizontalRatio: 0 });
  const [isScrolling, setIsScrolling] = useState(false);

  const getScrollInfo = useCallback((iframe) => {
    const iframeDoc = iframe.contentDocument;
    const { scrollTop } = iframeDoc.documentElement;
    const { scrollLeft } = iframeDoc.documentElement;
    const scrollHeight = iframeDoc.documentElement.scrollHeight - iframe.clientHeight;
    const scrollWidth = iframeDoc.documentElement.scrollWidth - iframe.clientWidth;

    return {
      top: scrollTop,
      left: scrollLeft,
      verticalRatio: scrollHeight > 0 ? scrollTop / scrollHeight : 0,
      horizontalRatio: scrollWidth > 0 ? scrollLeft / scrollWidth : 0,
    };
  }, []);

  const syncScroll = useCallback(
    (data) => {
      const iframe = iframeRef.current;
      if (!iframe || !iframe.contentDocument) return;

      const iframeDoc = iframe.contentDocument;
      const scrollHeight = iframeDoc.documentElement.scrollHeight - iframe.clientHeight;
      const scrollWidth = iframeDoc.documentElement.scrollWidth - iframe.clientWidth;

      iframeDoc.documentElement.scrollTop = data.verticalRatio * scrollHeight;
      iframeDoc.documentElement.scrollLeft = data.horizontalRatio * scrollWidth;
      lastScrollPositionRef.current = data;
    },
    [iframeRef],
  );

  useEffect(() => {
    if (socketRef.current) return;

    const ws = new WebSocket(WebSocketURL);
    socketRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "joinRoom", roomId: "1" }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "scrollUpdate" && !isScrolling) {
        syncScroll(data);
      }
    };

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      socketRef.current = null;
    };
  }, [syncScroll, isScrolling]);

  const handleScroll = useCallback(
    throttle(() => {
      const iframe = iframeRef.current;
      if (!iframe || !iframe.contentDocument) return;

      const currentInfo = getScrollInfo(iframe);
      const lastPosition = lastScrollPositionRef.current;

      const deltaVertical = currentInfo.verticalRatio - lastPosition.verticalRatio;
      const deltaHorizontal = currentInfo.horizontalRatio - lastPosition.horizontalRatio;

      if (
        Math.abs(deltaVertical) > SCROLL_THRESHOLD ||
        Math.abs(deltaHorizontal) > SCROLL_THRESHOLD
      ) {
        const scrollData = {
          type: "scrollUpdate",
          deltaVertical,
          deltaHorizontal,
          ...currentInfo,
        };

        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify(scrollData));
          lastScrollPositionRef.current = currentInfo;
        }
      }
    }, 50),
    [getScrollInfo, iframeRef],
  );

  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe) {
      const handleIframeLoad = () => {
        const iframeDoc = iframe.contentDocument;
        iframeDoc.addEventListener("scroll", handleScroll);
        iframeDoc.addEventListener("mousedown", () => setIsScrolling(true));
        iframeDoc.addEventListener("mouseup", () => setIsScrolling(false));
      };

      iframe.addEventListener("load", handleIframeLoad);

      return () => {
        const iframeDoc = iframe.contentDocument;
        if (iframeDoc) {
          iframeDoc.removeEventListener("scroll", handleScroll);
          iframeDoc.removeEventListener("mousedown", () => setIsScrolling(true));
          iframeDoc.removeEventListener("mouseup", () => setIsScrolling(false));
        }
        iframe.removeEventListener("load", handleIframeLoad);
      };
    }
  }, [iframeRef, handleScroll]);

  return null;
}
