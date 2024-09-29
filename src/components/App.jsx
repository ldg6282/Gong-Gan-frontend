import { useSetAtom } from "jotai";

import IframeLoader from "./IframeLoader";
import Header from "./Header";

import { roomIdAtom } from "../atoms/atoms";

export default function App({ roomId }) {
  const setRoomId = useSetAtom(roomIdAtom);

  if (roomId) {
    setRoomId(roomId);
  }

  return (
    <div className="fixed inset-0 flex flex-col h-screen w-screen bg-white">
      <Header />
      <div className="flex-grow w-full">
        <IframeLoader />
      </div>
    </div>
  );
}
