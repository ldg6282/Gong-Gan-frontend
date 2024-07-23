import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { htmlContentAtom, toastAtom } from "../atoms/atoms";
import ToastPopup from "./ToastPopup";

export default function PopupApp() {
  const [isShowCreateRoom, setIsShowCreateRoom] = useState(false);
  const [isShowJoinRoom, setIsShowJoinRoom] = useState(false);
  const [url, setUrl] = useAtom(htmlContentAtom);
  const [roomId, setRoomId] = useState("");
  const [socket, setSocket] = useState(null);
  const [, setToast] = useAtom(toastAtom);

  useEffect(() => {
    const ws = new WebSocket("https://73f0-14-52-239-67.ngrok-free.app");

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "roomCreated":
          setRoomId(data.roomId);
          chrome.tabs.create({ url }, (tab) => {
            chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
              if (tabId === tab.id && info.status === "complete") {
                chrome.tabs.onUpdated.removeListener(listener);
                chrome.tabs.sendMessage(tabId, { action: "initContent" });
              }
            });
          });
          break;

        case "roomJoined":
          setUrl(data.url);
          chrome.tabs.create({ url: data.url }, (tab) => {
            chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
              if (tabId === tab.id && info.status === "complete") {
                chrome.tabs.onUpdated.removeListener(listener);
                chrome.tabs.sendMessage(tabId, { action: "initContent" });
              }
            });
          });
          break;

        case "roomUpdated":
          setUrl(data.url);
          chrome.tabs.query({ url: data.url }, (tabs) => {
            tabs.forEach((tab) => {
              chrome.tabs.sendMessage(tab.id, { action: "initContent" });
            });
          });
          break;

        case "error":
          switch (data.context) {
            case "joinRoom":
              if (data.errorCode === "roomNotFound") {
                setToast({ message: "존재하지 않는 방입니다!" });
              }
              break;

            case "createRoom":
              if (data.errorCode === "roomAlreadyExists") {
                setToast({ message: "이미 존재하는 방입니다!" });
              }
              break;

            default:
              setToast({ message: "오류가 발생했습니다. 다시 시도해주세요" });
              break;
          }
          break;

        default:
          setToast({ message: "오류가 발생했습니다. 다시 시도해주세요" });
          break;
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

  function isValidUrlFormat(pageUrl) {
    const urlPattern = /^(http:\/\/|https:\/\/|www\.)[^\s/$.?#].[^\s]*$/i;
    return urlPattern.test(pageUrl);
  }

  function checkInputs(isJoinRoom) {
    switch (true) {
      case !roomId.trim():
        setToast({ message: "방 번호를 입력해주세요." });
        return false;

      case roomId.includes(" "):
        setToast({ message: "방 번호에 공백이 포함될 수 없습니다." });
        return false;

      case isJoinRoom && !url.trim():
        setToast({ message: "URL을 입력해주세요." });
        return false;

      case isJoinRoom && url.includes(" "):
        setToast({ message: "URL에 공백이 포함될 수 없습니다." });
        return false;

      case isJoinRoom && !isValidUrlFormat(url):
        setToast({ message: "유효하지 않은 URL 형식입니다." });
        return false;

      default:
        return true;
    }
  }

  function toggleExtension(status) {
    chrome.runtime.sendMessage({ action: "toggleExtension", status });
  }

  function handleCreateRoomSubmit() {
    if (checkInputs(true) && socket) {
      socket.send(JSON.stringify({ type: "createRoom", roomId, url }));
      toggleExtension(true);
    }
  }

  function handleJoinRoomSubmit() {
    if (checkInputs(false) && socket) {
      socket.send(JSON.stringify({ type: "joinRoom", roomId }));
      toggleExtension(true);
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
      <ToastPopup />
    </div>
  );
}
