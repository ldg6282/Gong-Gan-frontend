import { useState, useEffect, useCallback } from "react";
import { useSetAtom } from "jotai";
import { nanoid } from "nanoid";

import ToastPopup from "./ToastPopup";
import useWebSocket from "../hooks/useWebSocket";

import { toastAtom } from "../atoms/atoms";
import { handleWebSocketError, checkInputValidity } from "../utils/errorHandling";

export default function PopupApp() {
  const [isShowCreateRoom, setIsShowCreateRoom] = useState(false);
  const [isShowJoinRoom, setIsShowJoinRoom] = useState(false);
  const [url, setUrl] = useState("");
  const [roomId, setRoomId] = useState("");
  const setToast = useSetAtom(toastAtom);

  const { sendMessage, setOnMessage } = useWebSocket();

  const handleSocketMessage = useCallback(
    (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case "roomCreated":
        case "roomJoined":
          createTab(data.type === "roomCreated" ? url : data.url, roomId);
          break;
        case "error":
          handleWebSocketError(data, setToast);
          break;
      }
    },
    [url, roomId, setToast],
  );

  useEffect(() => {
    setOnMessage(handleSocketMessage);
  }, [setOnMessage, handleSocketMessage]);

  function handleCreateRoom() {
    const newRoomId = nanoid();
    setRoomId(newRoomId);
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

  function toggleExtension(status) {
    chrome.runtime.sendMessage({ action: "toggleExtension", status });
  }

  function setRoomIdInStorage(roomIdToStore, callback) {
    chrome.runtime.sendMessage({ action: "setRoomId", roomId: roomIdToStore }, callback);
  }

  function createTab(tabUrl, tabRoomId) {
    chrome.tabs.create({ url: tabUrl }, (tab) => {
      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (tabId === tab.id && info.status === "complete") {
          chrome.tabs.onUpdated.removeListener(listener);
          chrome.tabs.sendMessage(tabId, { action: "initContent", roomId: tabRoomId });
        }
      });
    });
  }

  function handleCreateRoomSubmit() {
    if (checkInputValidity(roomId, url, true, setToast)) {
      sendMessage({ type: "createRoom", roomId, url });
      setRoomIdInStorage(roomId, function (response) {
        if (response && response.success) {
          toggleExtension(true);
        }
      });
    }
  }

  function handleJoinRoomSubmit() {
    if (checkInputValidity(roomId, url, false, setToast)) {
      sendMessage({ type: "joinRoom", roomId });
      setRoomIdInStorage(roomId, function (response) {
        if (response.success) {
          toggleExtension(true);
        }
      });
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
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleJoinRoomSubmit();
              }
            }}
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
            value={roomId}
            readOnly
            className="p-2 border rounded w-full mb-2 bg-gray-100"
          />
          <input
            type="text"
            placeholder="URL 입력"
            value={url}
            onChange={handleUrlChange}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCreateRoomSubmit();
              }
            }}
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
      <ToastPopup />
    </div>
  );
}
