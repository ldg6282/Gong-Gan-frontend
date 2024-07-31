import { useEffect, useRef, useCallback } from "react";
import { useAtom } from "jotai";
import { userIdAtom } from "../atoms/atoms";

export default function ScrollSync({ iframeRef, roomId }) {
  const [userId] = useAtom(userIdAtom);
  const socketRef = useRef(null);
  const lastScrollPositionRef = useRef({ top: 0, left: 0, verticalRatio: 0, horizontalRatio: 0 });
  const isLocalScrollRef = useRef(true);

  const getScrollInfo = useCallback((iframe) => {
    const iframeDoc = iframe.contentDocument;
    const { scrollTop, scrollLeft, scrollHeight, scrollWidth, clientHeight, clientWidth } =
      iframeDoc.documentElement;

    return {
      top: scrollTop,
      left: scrollLeft,
      verticalRatio: scrollHeight > clientHeight ? scrollTop / (scrollHeight - clientHeight) : 0,
      horizontalRatio: scrollWidth > clientWidth ? scrollLeft / (scrollWidth - clientWidth) : 0,
    };
  }, []);

  const handleScroll = useCallback(() => {
    if (!isLocalScrollRef.current) {
      isLocalScrollRef.current = true;
      return;
    }

    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument || !roomId) return;

    const currentInfo = getScrollInfo(iframe);
    const lastPosition = lastScrollPositionRef.current;

    if (
      currentInfo.verticalRatio !== lastPosition.verticalRatio ||
      currentInfo.horizontalRatio !== lastPosition.horizontalRatio
    ) {
      const scrollData = {
        type: "scrollUpdate",
        roomId,
        userId,
        ...currentInfo,
      };

      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify(scrollData));
        lastScrollPositionRef.current = currentInfo;
      }
    }
  }, [roomId, userId, getScrollInfo, iframeRef]);

  useEffect(() => {
    if (socketRef.current || !roomId) return;

    const WS_SERVER_URL = import.meta.env.VITE_WS_SERVER_URL;
    const ws = new WebSocket(WS_SERVER_URL);
    socketRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "joinRoom", roomId, userId }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "scrollUpdate" && data.userId !== userId) {
        syncScroll(data);
      }
    };

    function syncScroll(data) {
      if (data.userId === userId) return;
      const iframe = iframeRef.current;
      if (!iframe || !iframe.contentDocument) return;

      isLocalScrollRef.current = false;

      const iframeDoc = iframe.contentDocument;
      const { scrollHeight, scrollWidth, clientHeight, clientWidth } = iframeDoc.documentElement;

      iframeDoc.documentElement.scrollTop = data.verticalRatio * (scrollHeight - clientHeight);
      iframeDoc.documentElement.scrollLeft = data.horizontalRatio * (scrollWidth - clientWidth);
      lastScrollPositionRef.current = data;
    }

    const iframe = iframeRef.current;
    if (iframe) {
      const handleIframeLoad = () => {
        const iframeDoc = iframe.contentDocument;
        iframeDoc.addEventListener("scroll", handleScroll);
      };

      iframe.addEventListener("load", handleIframeLoad);

      return () => {
        if (socketRef.current) {
          socketRef.current.close();
        }
        socketRef.current = null;

        const iframeDoc = iframe.contentDocument;
        if (iframeDoc) {
          iframeDoc.removeEventListener("scroll", handleScroll);
        }
        iframe.removeEventListener("load", handleIframeLoad);
      };
    }
  }, [roomId, userId, iframeRef, handleScroll]);

  return null;
}
