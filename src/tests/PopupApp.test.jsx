import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useAtom } from "jotai";
import PopupApp from "../components/PopupApp";

vi.mock("jotai", () => ({
  useAtom: vi.fn(),
}));

vi.mock("../atoms/atoms", () => ({
  htmlContentAtom: "mocked-html-content-atom",
  toastAtom: "mocked-toast-atom",
}));

global.chrome = {
  runtime: {
    sendMessage: vi.fn((message, callback) => callback && callback({ success: true })),
  },
  tabs: {
    create: vi.fn((options, callback) => callback && callback({ id: 1 })),
    onUpdated: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    sendMessage: vi.fn(),
  },
};

let mockWebSocket;
global.WebSocket = vi.fn(() => {
  mockWebSocket = {
    send: vi.fn(),
    close: vi.fn(),
    onmessage: null,
  };
  return mockWebSocket;
});

describe("PopupApp", () => {
  let mockSetUrl;
  let mockSetToast;

  beforeEach(() => {
    mockSetUrl = vi.fn();
    mockSetToast = vi.fn();
    useAtom.mockImplementation((atom) => {
      if (atom === "mocked-html-content-atom") return ["", mockSetUrl];
      if (atom === "mocked-toast-atom") return [{}, mockSetToast];
      return [];
    });
  });

  it("공간 생성 버튼 클릭 시 공간 생성 폼이 표시되어야 함", () => {
    render(<PopupApp />);
    fireEvent.click(screen.getByRole("button", { name: "공간 생성" }));
    expect(screen.getByText("공간 생성", { selector: "h2" })).toBeInTheDocument();
  });

  it("참여하기 버튼 클릭 시 참여하기 폼이 표시되어야 함", () => {
    render(<PopupApp />);
    fireEvent.click(screen.getByRole("button", { name: "참여하기" }));
    expect(screen.getByText("참여하기", { selector: "h2" })).toBeInTheDocument();
  });

  it("URL 입력 시 상태가 업데이트되어야 함", () => {
    render(<PopupApp />);
    fireEvent.click(screen.getByRole("button", { name: "공간 생성" }));
    const urlInput = screen.getByPlaceholderText("URL 입력");
    fireEvent.change(urlInput, { target: { value: "https://example.com" } });
    expect(mockSetUrl).toHaveBeenCalledWith("https://example.com");
  });

  it("유효하지 않은 URL 입력 시 오류 메시지가 표시되어야 함", async () => {
    render(<PopupApp />);
    fireEvent.click(screen.getByRole("button", { name: "공간 생성" }));
    const urlInput = screen.getByPlaceholderText("URL 입력");
    fireEvent.change(urlInput, { target: { value: "not a url" } });
    fireEvent.click(screen.getByText("공간 생성", { selector: "div.mt-4 button" }));

    await waitFor(() => {
      expect(mockSetToast).toHaveBeenCalledWith({
        message: "URL을 입력해주세요.",
        type: "error",
      });
    });
  });

  it("방 번호 없이 참여하기 시도 시 오류 메시지가 표시되어야 함", async () => {
    render(<PopupApp />);
    fireEvent.click(screen.getByRole("button", { name: "참여하기" }));
    fireEvent.click(screen.getByText("참여하기", { selector: "div.mt-4 button" }));

    await waitFor(() => {
      expect(mockSetToast).toHaveBeenCalledWith({
        message: "방 번호를 입력해주세요.",
        type: "error",
      });
    });
  });

  it("참여하기 제출 시 올바른 메시지를 전송하고 응답을 처리해야 함", async () => {
    render(<PopupApp />);
    fireEvent.click(screen.getByRole("button", { name: "참여하기" }));
    const roomInput = screen.getByPlaceholderText("방 번호 입력");
    fireEvent.change(roomInput, { target: { value: "room1" } });
    fireEvent.click(screen.getByText("참여하기", { selector: "div.mt-4 button" }));

    await waitFor(
      () => {
        expect(mockWebSocket.send).toHaveBeenCalledWith(
          expect.stringContaining(`"type":"joinRoom"`),
        );
        expect(chrome.runtime.sendMessage).toHaveBeenCalled();
      },
      { timeout: 10000 },
    );
  });
});
