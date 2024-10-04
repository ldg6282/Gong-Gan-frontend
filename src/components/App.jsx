import { useAtom, useSetAtom } from "jotai";
import { nanoid } from "nanoid";

import IframeLoader from "./IframeLoader";
import Header from "./Header";

import { roomIdAtom, userIdAtom } from "../atoms/atoms";

export default function App({ roomId }) {
  const setRoomId = useSetAtom(roomIdAtom);
  const [userId, setUserId] = useAtom(userIdAtom);

  if (roomId) {
    setRoomId(roomId);
  }

  if (!userId) {
    const newUserId = `user_${nanoid()}`;
    setUserId(newUserId);
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
