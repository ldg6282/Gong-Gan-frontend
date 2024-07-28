import { useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import { userIdAtom } from "../atoms/atoms";

export default function ScrollSync({ iframeRef, roomId }) {
  const [userId] = useAtom(userIdAtom);
  const [isScrolling, setIsScrolling] = useState(false);
  const socketRef = useRef(null);
  const lastScrollPositionRef = useRef({ top: 0, left: 0, verticalRatio: 0, horizontalRatio: 0 });

  useEffect(() => {
    if (socketRef.current || !roomId) return;

    const ws = new WebSocket("https://1612-14-52-239-67.ngrok-free.app");
    socketRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "joinRoom", roomId, userId }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "scrollUpdate" && data.userId !== userId && !isScrolling) {
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

  function getScrollInfo(iframe) {
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
  }

  function syncScroll(data) {
    if (data.userId === userId) return;
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument) return;

    const iframeDoc = iframe.contentDocument;
    const { scrollHeight, scrollWidth, clientHeight, clientWidth } = iframeDoc.documentElement;

    iframeDoc.documentElement.scrollTop = data.verticalRatio * (scrollHeight - clientHeight);
    iframeDoc.documentElement.scrollLeft = data.horizontalRatio * (scrollWidth - clientWidth);
    lastScrollPositionRef.current = data;
  }

  function handleScroll() {
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
  }

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
