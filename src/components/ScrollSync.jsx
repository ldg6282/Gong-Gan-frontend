import { useEffect, useRef, useCallback, useState } from "react";
import { throttle } from "lodash";

export default function ScrollSync({ iframeRef, roomId }) {
  const socketRef = useRef(null);
  const lastScrollPositionRef = useRef({ top: 0, left: 0, verticalRatio: 0, horizontalRatio: 0 });
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    if (socketRef.current || !roomId) return;

    const ws = new WebSocket("https://aa52-14-52-239-67.ngrok-free.app");
    socketRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "joinRoom", roomId }));
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
  }, [roomId]);

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

  const handleScroll = useCallback(
    throttle(() => {
      const iframe = iframeRef.current;
      if (!iframe || !iframe.contentDocument || !roomId) return;

      const currentInfo = getScrollInfo(iframe);
      const lastPosition = lastScrollPositionRef.current;

      const deltaVertical = currentInfo.verticalRatio - lastPosition.verticalRatio;
      const deltaHorizontal = currentInfo.horizontalRatio - lastPosition.horizontalRatio;

      if (Math.abs(deltaVertical) > 0.005 || Math.abs(deltaHorizontal) > 0.005) {
        const scrollData = {
          type: "scrollUpdate",
          roomId,
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
    [getScrollInfo, iframeRef, roomId],
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
