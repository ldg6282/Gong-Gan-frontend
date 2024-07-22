import { useAtom } from "jotai";
import { useEffect } from "react";
import { htmlContentAtom } from "../atoms/atoms";
import ButtonGroup from "./ButtonGroup";

export default function Header() {
  const [url, setUrl] = useAtom(htmlContentAtom);

  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  function handleChange(e) {
    setUrl(e.target.value);
  }

  return (
    <div className="p-4 flex justify-between bg-blue items-center h-16">
      <div className="flex items-center flex-1">
        <h1 className="text-2xl font-sans font-black">Gong-Gan</h1>
      </div>
      <div className="flex justify-center flex-1">
        <input
          type="text"
          value={url}
          onChange={handleChange}
          placeholder="Enter URL"
          className="p-2 rounded border-2 border-gray-300 text-ml font-sans font-light w-96"
        />
      </div>
      <div className="flex justify-end flex-1">
        <ButtonGroup />
      </div>
    </div>
  );
}
