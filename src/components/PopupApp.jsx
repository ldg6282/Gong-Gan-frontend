import { useState } from "react";
import { useAtom } from "jotai";
import htmlContentAtom from "../atoms/atoms";

export default function PopupApp() {
  const [isShowCreateRoom, setIsShowCreateRoom] = useState(false);
  const [isShowJoinRoom, setIsShowJoinRoom] = useState(false);
  const [url, setUrl] = useAtom(htmlContentAtom);

  function handleCreateRoom() {
    setIsShowCreateRoom(true);
    setIsShowJoinRoom(false);
  }

  function handleJoinRoom() {
    setIsShowCreateRoom(false);
    setIsShowJoinRoom(true);
  }

  function handleUrlChange(e) {
    setUrl(e.target.value);
  }

  function handleRoomButtonClick() {
    chrome.tabs.create({ url }, (tab) => {
      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (tabId === tab.id && info.status === "complete") {
          chrome.tabs.onUpdated.removeListener(listener);
          chrome.tabs.sendMessage(tabId, { action: "initContent" });
        }
      });
    });
  }

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
      {isShowJoinRoom && (
        <div className="mt-4">
          <h2 className="text-lg mb-2 font-sans">참여하기</h2>
          <input
            type="text"
            placeholder="방 번호 입력"
            className="p-2 border rounded w-full mb-2"
          />
          <button
            type="button"
            className="p-2 bg-blue rounded-md w-full font-sans"
            onClick={handleRoomButtonClick}
          >
            참여하기
          </button>
        </div>
      )}
      {isShowCreateRoom && (
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
          <button
            type="button"
            className="p-2 bg-blue rounded-md w-full font-sans"
            onClick={handleRoomButtonClick}
          >
            공간 생성
          </button>
        </div>
      )}
    </div>
  );
}
