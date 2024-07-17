import { useState } from "react";

export default function PopupApp() {
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showJoinRoom, setShowJoinRoom] = useState(false);

  const handleCreateRoom = () => {
    setShowCreateRoom(true);
    setShowJoinRoom(false);
  };

  const handleJoinRoom = () => {
    setShowCreateRoom(false);
    setShowJoinRoom(true);
  };

  return (
    <div className="p-4 w-[400px]">
      <h1 className="text-xl mb-4 font-sans">Gong-Gan에 오신것을 환영합니다.</h1>
      <div className="flex space-x-2 mb-4">
        <button
          type="button"
          onClick={handleJoinRoom}
          className="m-2 p-2 bg-blue rounded w-full font-sans rounded-md"
        >
          참여하기
        </button>
        <button
          type="button"
          onClick={handleCreateRoom}
          className="m-2 p-2 bg-blue rounded w-full font-sans rounded-md"
        >
          공간 생성
        </button>
      </div>
      {showJoinRoom && (
        <div className="mt-4">
          <h2 className="text-lg mb-2 font-sans">참여하기</h2>
          <input
            type="text"
            placeholder="방 번호 입력"
            className="p-2 border rounded w-full mb-2"
          />
          <button type="button" className="p-2 bg-blue rounded-md w-full font-sans">
            참여하기
          </button>
        </div>
      )}
      {showCreateRoom && (
        <div className="mt-4">
          <h2 className="text-lg mb-2 font-sans">공간 생성</h2>
          <input
            type="text"
            placeholder="방 번호 입력"
            className="p-2 border rounded w-full mb-2"
          />
          <input
            type="text"
            placeholder="URL 입력"
            className="p-2 border rounded w-full mb-2"
            onChange={handleUrlChange}
          />
          <button type="button" className="p-2 bg-blue rounded-md w-full font-sans">
            공간 생성
          </button>
        </div>
      )}
    </div>
  );
}
