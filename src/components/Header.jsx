import { useEffect } from "react";
import { useAtom } from "jotai";

import ButtonGroup from "./ButtonGroup";
import ToastPopup from "./ToastPopup";

import { htmlContentAtom, roomIdAtom, toastAtom } from "../atoms/atoms";

export default function Header() {
  const [roomId] = useAtom(roomIdAtom);
  const [, setUrl] = useAtom(htmlContentAtom);
  const [, setToast] = useAtom(toastAtom);

  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  function copyRoomId() {
    if (roomId) {
      navigator.clipboard.writeText(roomId).then(
        () => {
          setToast({ message: "방 번호가 클립보드에 복사되었습니다.", type: "success" });
        },
        () => {
          setToast({ message: "방 번호 복사에 실패했습니다.", type: "error" });
        },
      );
    }
  }

  return (
    <div className="p-4 flex justify-between bg-blue items-center h-16">
      <div className="flex items-center flex-1">
        <h1 className="text-2xl font-sans font-black">Gong-Gan</h1>
        <button type="button" onClick={copyRoomId} className="ml-4 p-2 font-sans">
          방 번호 복사
        </button>
      </div>
      <div className="flex justify-end flex-1">
        <ButtonGroup />
      </div>
      <ToastPopup className="top-40" />
    </div>
  );
}
