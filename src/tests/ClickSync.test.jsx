import { useAtom } from "jotai";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import ClickSync from "../components/ClickSync";

vi.mock("jotai", () => ({
  atom: vi.fn(),
  useAtom: vi.fn(),
}));

vi.mock("../atoms/atoms", () => ({
  userIdAtom: "mocked-user-id-atom",
}));

vi.mock("lodash", () => ({
  debounce: (fn) => fn,
}));

const WS_SERVER_URL = "https://gong-gan.onrender.com";

function MockWebSocket(url) {
  return {
    url,
    readyState: WebSocket.OPEN,
    onopen: null,
    onmessage: null,
    send: vi.fn(),
    close: vi.fn(),
  };
}

global.WebSocket = vi.fn().mockImplementation((url) => MockWebSocket(url));

global.MutationObserver = function (callback) {
  this.observe = vi.fn();
  this.disconnect = vi.fn();
  this.trigger = (mutations) => callback(mutations, this);
};

function setup() {
  const mockIframeRef = {
    current: {
      contentDocument: {
        documentElement: {
          clientWidth: 1000,
          clientHeight: 500,
        },
        body: {
          appendChild: vi.fn(),
        },
        createElement: vi.fn().mockReturnValue({
          style: {},
          remove: vi.fn(),
        }),
        elementFromPoint: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        readyState: "complete",
        dispatchEvent: vi.fn(),
      },
      contentWindow: {
        location: { href: "https://example.com" },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
      src: "https://example.com",
      clientWidth: 1000,
      clientHeight: 500,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    },
  };
  const mockRoomId = "test-room";
  const mockUserId = "test-user";

  useAtom.mockReturnValue([mockUserId]);

  return { mockIframeRef, mockRoomId, mockUserId };
}

describe("ClickSync", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("마운트 시 WebSocket 연결을 초기화해야 함", () => {
    const { mockIframeRef, mockRoomId } = setup();
    render(<ClickSync iframeRef={mockIframeRef} roomId={mockRoomId} />);
    expect(global.WebSocket).toHaveBeenCalledWith(WS_SERVER_URL);
  });

  it("WebSocket 연결 시 방 참가 메시지를 보내야 함", () => {
    const { mockIframeRef, mockRoomId, mockUserId } = setup();
    render(<ClickSync iframeRef={mockIframeRef} roomId={mockRoomId} />);
    const mockWs = global.WebSocket.mock.results[0].value;
    act(() => {
      mockWs.onopen();
    });
    expect(mockWs.send).toHaveBeenCalledWith(
      JSON.stringify({ type: "joinRoom", roomId: mockRoomId, userId: mockUserId }),
    );
  });

  it("클릭 이벤트를 처리하고 업데이트를 전송해야 함", () => {
    const { mockIframeRef, mockRoomId } = setup();
    render(<ClickSync iframeRef={mockIframeRef} roomId={mockRoomId} />);
    const mockWs = global.WebSocket.mock.results[0].value;

    act(() => {
      const loadHandler = mockIframeRef.current.addEventListener.mock.calls.find(
        (call) => call[0] === "load",
      )[1];
      loadHandler();
    });

    const clickEvent = new MouseEvent("click", { clientX: 100, clientY: 50 });
    act(() => {
      const clickHandler = mockIframeRef.current.contentDocument.addEventListener.mock.calls.find(
        (call) => call[0] === "click",
      )[1];
      clickHandler(clickEvent);
    });

    expect(mockWs.send).toHaveBeenCalledWith(expect.stringContaining(`"type":"clickEvent"`));
  });

  it("클릭 이벤트 수신 시 클릭을 시뮬레이션해야 함", () => {
    const { mockIframeRef, mockRoomId } = setup();
    render(<ClickSync iframeRef={mockIframeRef} roomId={mockRoomId} />);
    const mockWs = global.WebSocket.mock.results[0].value;

    const mockClickData = {
      type: "clickEvent",
      userId: "other-user",
      relativeX: 0.1,
      relativeY: 0.1,
      iframeWidth: 1000,
      iframeHeight: 500,
    };

    const mockElement = { dispatchEvent: vi.fn() };
    mockIframeRef.current.contentDocument.elementFromPoint.mockReturnValue(mockElement);

    act(() => {
      mockWs.onmessage({ data: JSON.stringify(mockClickData) });
    });

    expect(mockElement.dispatchEvent).toHaveBeenCalled();
    expect(mockIframeRef.current.contentDocument.createElement).toHaveBeenCalledWith("div");
    expect(mockIframeRef.current.contentDocument.body.appendChild).toHaveBeenCalled();
  });

  it("URL 변경 시 업데이트를 전송해야 함", async () => {
    const { mockIframeRef, mockRoomId } = setup();
    let mutationObserverCallback;

    global.MutationObserver = function (callback) {
      mutationObserverCallback = callback;
      return {
        observe: vi.fn(),
        disconnect: vi.fn(),
      };
    };

    render(<ClickSync iframeRef={mockIframeRef} roomId={mockRoomId} />);
    const mockWs = global.WebSocket.mock.results[0].value;

    await act(async () => {
      const loadHandler = mockIframeRef.current.addEventListener.mock.calls.find(
        (call) => call[0] === "load",
      )[1];
      await loadHandler();
    });

    await act(async () => {
      mockIframeRef.current.contentWindow.location.href = "https://example.com/newpage";
      await mutationObserverCallback([{ type: "childList" }]);
    });

    expect(mockWs.send).toHaveBeenCalledWith(expect.stringContaining(`"type":"urlChange"`));
  });

  it("언마운트 시 정리 작업을 수행해야 함", () => {
    const { mockIframeRef, mockRoomId } = setup();
    const { unmount } = render(<ClickSync iframeRef={mockIframeRef} roomId={mockRoomId} />);
    const mockWs = global.WebSocket.mock.results[0].value;

    unmount();

    expect(mockWs.close).toHaveBeenCalled();
    expect(mockIframeRef.current.removeEventListener).toHaveBeenCalled();
    expect(mockIframeRef.current.contentDocument.removeEventListener).toHaveBeenCalled();
    expect(mockIframeRef.current.contentWindow.removeEventListener).toHaveBeenCalled();
  });
});
