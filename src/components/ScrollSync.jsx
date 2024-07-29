import { useEffect, useRef, useCallback } from "react";
import { useAtom } from "jotai";
import { userIdAtom } from "../atoms/atoms";

export default function ScrollSync({ iframeRef, roomId }) {
  const [userId] = useAtom(userIdAtom);
  const socketRef = useRef(null);
  const lastScrollPositionRef = useRef({ top: 0, left: 0, verticalRatio: 0, horizontalRatio: 0 });
  const isScrollRef = useRef(false);

  useEffect(() => {
    if (socketRef.current || !roomId) return;

    const ws = new WebSocket("https://1612-14-52-239-67.ngrok-free.app");
    socketRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "joinRoom", roomId, userId }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "scrollUpdate" && data.userId !== userId && !isScrollRef.current) {
        syncScroll(data);
      }
    };

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      socketRef.current = null;
    };
  }, [roomId, userId]);

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

  const syncScroll = useCallback(
    (data) => {
      if (data.userId === userId) return;
      const iframe = iframeRef.current;
      if (!iframe || !iframe.contentDocument) return;

      const iframeDoc = iframe.contentDocument;
      const { scrollHeight, scrollWidth, clientHeight, clientWidth } = iframeDoc.documentElement;

      iframeDoc.documentElement.scrollTop = data.verticalRatio * (scrollHeight - clientHeight);
      iframeDoc.documentElement.scrollLeft = data.horizontalRatio * (scrollWidth - clientWidth);
      lastScrollPositionRef.current = data;
    },
    [iframeRef, userId],
  );

  const handleScroll = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument || !roomId) return;

    isScrollRef.current = true;

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

    isScrollRef.current = false;
  }, [getScrollInfo, roomId, userId]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe) {
      const handleIframeLoad = () => {
        const iframeDoc = iframe.contentDocument;
        iframeDoc.addEventListener("scroll", handleScroll);
      };

      iframe.addEventListener("load", handleIframeLoad);

      return () => {
        const iframeDoc = iframe.contentDocument;
        if (iframeDoc) {
          iframeDoc.removeEventListener("scroll", handleScroll);
        }
        iframe.removeEventListener("load", handleIframeLoad);
      };
    }
  }, [iframeRef, handleScroll]);

  return null;
}
