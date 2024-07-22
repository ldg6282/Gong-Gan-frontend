import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { htmlContentAtom } from "../atoms/atoms";

export default function PopupApp() {
  const [isShowCreateRoom, setIsShowCreateRoom] = useState(false);
  const [isShowJoinRoom, setIsShowJoinRoom] = useState(false);
  const [url, setUrl] = useAtom(htmlContentAtom);
  const [roomId, setRoomId] = useState("");
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const ws = new WebSocket("https://73f0-14-52-239-67.ngrok-free.app");
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "roomCreated") {
        setRoomId(data.roomId);
        chrome.tabs.create({ url }, (tab) => {
          chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
            if (tabId === tab.id && info.status === "complete") {
              chrome.tabs.onUpdated.removeListener(listener);
              chrome.tabs.sendMessage(tabId, { action: "initContent" });
            }
          });
        });
      } else if (data.type === "roomJoined") {
        setUrl(data.url);
        chrome.tabs.create({ url: data.url }, (tab) => {
          chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
            if (tabId === tab.id && info.status === "complete") {
              chrome.tabs.onUpdated.removeListener(listener);
              chrome.tabs.sendMessage(tabId, { action: "initContent" });
            }
          });
        });
      } else if (data.type === "roomUpdated") {
        setUrl(data.url);
        chrome.tabs.query({ url: data.url }, (tabs) => {
          tabs.forEach((tab) => {
            chrome.tabs.sendMessage(tab.id, { action: "initContent" });
          });
        });
      }
    };
    setSocket(ws);

    return () => ws.close();
  }, [url]);

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

  function handleCreateRoomSubmit() {
    if (socket) {
      socket.send(JSON.stringify({ type: "createRoom", roomId, url }));
    }
  }

  function handleJoinRoomSubmit() {
    if (socket) {
      socket.send(JSON.stringify({ type: "joinRoom", roomId }));
    }
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
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="p-2 border rounded w-full mb-2"
          />
          <button
            type="button"
            className="p-2 bg-blue rounded-md w-full font-sans"
            onClick={handleJoinRoomSubmit}
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
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="p-2 border rounded w-full mb-2"
          />
          <input
            type="text"
            placeholder="URL 입력"
            value={url}
            onChange={handleUrlChange}
            className="p-2 border rounded w-full mb-2"
          />
          <button
            type="button"
            className="p-2 bg-blue rounded-md w-full font-sans"
            onClick={handleCreateRoomSubmit}
          >
            공간 생성
          </button>
        </div>
      )}
    </div>
  );
}
