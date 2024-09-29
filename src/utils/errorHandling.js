export function handleWebSocketError(data, context, setToast) {
  if (data.errorCode === "roomNotFound" && context === "join") {
    setToast({ message: "존재하지 않는 방입니다!", type: "error" });
  }
}

export function checkInputValidity(roomId, url, isJoinRoom, setToast) {
  if (!roomId.trim()) {
    setToast({ message: "방 번호를 입력해주세요.", type: "error" });
    return false;
  }
  if (roomId.includes(" ")) {
    setToast({ message: "방 번호에 공백이 포함될 수 없습니다.", type: "error" });
    return false;
  }
  if (isJoinRoom) {
    if (!url.trim()) {
      setToast({ message: "URL을 입력해주세요.", type: "error" });
      return false;
    }
    if (url.includes(" ")) {
      setToast({ message: "URL에 공백이 포함될 수 없습니다.", type: "error" });
      return false;
    }
    if (!isValidUrlFormat(url)) {
      setToast({ message: "유효하지 않은 URL 형식입니다.", type: "error" });
      return false;
    }
  }
  return true;
}

function isValidUrlFormat(pageUrl) {
  const urlPattern = /^(http:\/\/|https:\/\/|www\.)[^\s/$.?#].[^\s]*$/i;
  return urlPattern.test(pageUrl);
}
