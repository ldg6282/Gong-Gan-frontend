import { useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import { nanoid } from "nanoid";
import { zoomScaleAtom, htmlContentAtom, userIdAtom } from "../atoms/atoms";
import ScrollSync from "./ScrollSync";
import ClickSync from "./ClickSync";
import VoiceChat from "./VoiceChat";
import DrawingSync from "./DrawingSync";

export default function IframeLoader({ roomId }) {
  const iframeRef = useRef(null);
  const [url] = useAtom(htmlContentAtom);
  const [scale] = useAtom(zoomScaleAtom);
  const [userId, setUserId] = useAtom(userIdAtom);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!userId) {
      const newUserId = `user_${nanoid()}`;
      setUserId(newUserId);
    }
  }, [userId, setUserId]);

  useEffect(() => {
    const updateDimensions = () => {
      const { innerWidth: width, innerHeight: height } = window;
      setDimensions({ width, height });
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  useEffect(() => {
    if (iframeRef.current) {
      iframeRef.current.src = url;
    }
  }, [url]);

  return (
    <div className="relative flex justify-center items-center h-screen w-screen">
      <div
        className="relative border-8 border-blue rounded"
        style={{
          width: `${dimensions.width * 0.7}px`,
          height: `${dimensions.height * 0.8}px`,
          transform: `scale(${scale})`,
          transformOrigin: "center",
          top: "-2.5vh",
        }}
      >
        <iframe ref={iframeRef} title="Content Frame" className="w-full h-full" />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
          }}
        >
          <DrawingSync iframeRef={iframeRef} roomId={roomId} />
        </div>
      </div>
      <ScrollSync iframeRef={iframeRef} roomId={roomId} />
      <ClickSync iframeRef={iframeRef} roomId={roomId} />
      <VoiceChat roomId={roomId} />
    </div>
  );
}
