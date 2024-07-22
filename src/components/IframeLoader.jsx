import { useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import { zoomScaleAtom, htmlContentAtom } from "../atoms/atoms";

export default function IframeLoader() {
  const iframeRef = useRef(null);
  const [url] = useAtom(htmlContentAtom);
  const [scale] = useAtom(zoomScaleAtom);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

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
        className="relative p-10 bg-blue rounded"
        style={{
          width: `${dimensions.width * 0.7}px`,
          height: `${dimensions.height * 0.8}px`,
          transform: `scale(${scale})`,
          transformOrigin: "center",
        }}
      >
        <iframe ref={iframeRef} title="Content Frame" className="w-full h-full" />
      </div>
    </div>
  );
}
