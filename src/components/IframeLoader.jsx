import { useEffect, useRef } from "react";
import { useAtom } from "jotai";
import htmlContentAtom from "../atoms/atoms";

export default function IframeLoader() {
  const iframeRef = useRef(null);
  const [url] = useAtom(htmlContentAtom);

  useEffect(() => {
    if (iframeRef.current) {
      iframeRef.current.src = url;
    }
  }, [url]);

  return (
    <iframe
      ref={iframeRef}
      title="Content Frame"
      style={{
        width: "80%",
        height: "80%",
        position: "fixed",
        zIndex: "9999",
        marginLeft: "10%",
        marginTop: "3%",
      }}
    />
  );
}
