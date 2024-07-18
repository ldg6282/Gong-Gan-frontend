import { useAtom } from "jotai";
import { useEffect } from "react";
import htmlContentAtom from "../atoms/atoms";

export default function Header() {
  const [url, setUrl] = useAtom(htmlContentAtom);

  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  function handleChange(e) {
    setUrl(e.target.value);
  }

  return (
    <div className="p-4 flex justify-between items-center">
      <h1 className="text-2xl font-sans font-black">Gong-Gan</h1>
      <input
        type="text"
        value={url}
        onChange={handleChange}
        placeholder="Enter URL"
        className="p-2 rounded border-2 border-white text-ml font-sans font-light"
      />
    </div>
  );
}
