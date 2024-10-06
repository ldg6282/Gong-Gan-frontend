import { useEffect, useRef } from "react";
import { useAtom } from "jotai";

import { roomIdAtom, userIdAtom } from "../atoms/atoms";
import useWebSocket from "./useWebSocket";

export default function useScrollSync(iframeRef) {
  const [roomId] = useAtom(roomIdAtom);
  const [userId] = useAtom(userIdAtom);
  const { sendMessage, setOnMessage } = useWebSocket();

  const lastScrollPositionRef = useRef({ top: 0, left: 0, verticalRatio: 0, horizontalRatio: 0 });
  const isLocalScrollRef = useRef(true);

  function getScrollInfo(iframe) {
    const iframeDoc = iframe.contentDocument;
    const { scrollTop, scrollLeft, scrollHeight, scrollWidth, clientHeight, clientWidth } =
      iframeDoc.documentElement;

    return {
      top: scrollTop,
      left: scrollLeft,
      verticalRatio: scrollHeight > clientHeight ? scrollTop / (scrollHeight - clientHeight) : 0,
      horizontalRatio: scrollWidth > clientWidth ? scrollLeft / (scrollWidth - clientWidth) : 0,
    };
  }

  function isScrollChanged(currentInfo) {
    const lastPosition = lastScrollPositionRef.current;
    return (
      currentInfo.verticalRatio !== lastPosition.verticalRatio ||
      currentInfo.horizontalRatio !== lastPosition.horizontalRatio
    );
  }

  function sendScrollUpdate(currentInfo) {
    const scrollData = {
      type: "scrollUpdate",
      roomId,
      userId,
      ...currentInfo,
    };
    sendMessage(scrollData);
    lastScrollPositionRef.current = currentInfo;
  }

  function handleScroll() {
    if (!isLocalScrollRef.current) {
      isLocalScrollRef.current = true;
      return;
    }

    if (!iframeRef.current) return;

    const currentInfo = getScrollInfo(iframeRef.current);
    if (isScrollChanged(currentInfo)) {
      sendScrollUpdate(currentInfo);
    }
  }

  function syncScroll(data) {
    if (data.userId === userId) return;

    const iframeDoc = iframeRef.current.contentDocument.documentElement;
    if (!iframeDoc) return;

    isLocalScrollRef.current = false;
    iframeDoc.scrollTop = data.verticalRatio * (iframeDoc.scrollHeight - iframeDoc.clientHeight);
    iframeDoc.scrollLeft = data.horizontalRatio * (iframeDoc.scrollWidth - iframeDoc.clientWidth);
    lastScrollPositionRef.current = data;
  }

  function handleIframeLoad() {
    const iframeDoc = iframeRef.current.contentDocument;
    if (iframeDoc) {
      iframeDoc.addEventListener("scroll", handleScroll);
    }
  }

  function handleScrollUpdate(event) {
    const data = JSON.parse(event.data);
    if (data.type === "scrollUpdate") {
      syncScroll(data);
    }
  }

  useEffect(
    function () {
      if (iframeRef.current) {
        iframeRef.current.addEventListener("load", handleIframeLoad);
      }

      setOnMessage(handleScrollUpdate);

      return () => {
        if (iframeRef.current) {
          iframeRef.current.removeEventListener("load", handleIframeLoad);
          const iframeDoc = iframeRef.current.contentDocument;
          iframeDoc.removeEventListener("scroll", handleScroll);
        }
      };
    },
    [setOnMessage],
  );
}
