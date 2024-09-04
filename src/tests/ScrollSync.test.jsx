import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import { useAtom } from "jotai";
import ScrollSync from "../components/ScrollSync";

vi.mock("jotai", () => ({
  atom: vi.fn(),
  useAtom: vi.fn(),
}));

vi.mock("../atoms/atoms", () => ({
  userIdAtom: "mocked-user-id-atom",
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

describe("ScrollSync", () => {
  let mockIframeRef;
  let mockRoomId;
  let mockUserId;

  beforeEach(() => {
    mockIframeRef = {
      current: {
        contentDocument: {
          documentElement: {
            scrollTop: 0,
            scrollLeft: 0,
            scrollHeight: 1000,
            scrollWidth: 1000,
            clientHeight: 500,
            clientWidth: 500,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
          },
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    };
    mockRoomId = "test-room";
    mockUserId = "test-user";

    useAtom.mockReturnValue([mockUserId]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("마운트 시 WebSocket 연결을 초기화해야 함", () => {
    render(<ScrollSync iframeRef={mockIframeRef} roomId={mockRoomId} />);
    expect(global.WebSocket).toHaveBeenCalledWith(WS_SERVER_URL);
  });

  it("WebSocket 연결 시 방 참가 메시지를 보내야 함", () => {
    render(<ScrollSync iframeRef={mockIframeRef} roomId={mockRoomId} />);
    const mockWs = global.WebSocket.mock.results[0].value;
    act(() => {
      mockWs.onopen();
    });
    expect(mockWs.send).toHaveBeenCalledWith(
      JSON.stringify({ type: "joinRoom", roomId: mockRoomId, userId: mockUserId }),
    );
  });

  it("스크롤 이벤트를 처리하고 업데이트를 전송해야 함", () => {
    render(<ScrollSync iframeRef={mockIframeRef} roomId={mockRoomId} />);
    const mockWs = global.WebSocket.mock.results[0].value;

    act(() => {
      const loadHandler = mockIframeRef.current.addEventListener.mock.calls.find(
        (call) => call[0] === "load",
      )[1];
      loadHandler();
    });

    expect(mockIframeRef.current.contentDocument.addEventListener).toHaveBeenCalledWith(
      "scroll",
      expect.any(Function),
    );

    act(() => {
      mockIframeRef.current.contentDocument.documentElement.scrollTop = 250;
      const scrollHandler = mockIframeRef.current.contentDocument.addEventListener.mock.calls.find(
        (call) => call[0] === "scroll",
      )[1];
      scrollHandler();
    });

    expect(mockWs.send).toHaveBeenCalledWith(expect.stringContaining(`"type":"scrollUpdate"`));
  });

  it("스크롤 업데이트 수신 시 스크롤 위치를 동기화해야 함", () => {
    render(<ScrollSync iframeRef={mockIframeRef} roomId={mockRoomId} />);
    const mockWs = global.WebSocket.mock.results[0].value;

    const mockScrollData = {
      type: "scrollUpdate",
      userId: "other-user",
      verticalRatio: 0.5,
      horizontalRatio: 0.25,
    };

    act(() => {
      mockWs.onmessage({ data: JSON.stringify(mockScrollData) });
    });

    expect(mockIframeRef.current.contentDocument.documentElement.scrollTop).toBe(250);
    expect(mockIframeRef.current.contentDocument.documentElement.scrollLeft).toBe(125);
  });

  it("언마운트 시 정리 작업을 수행해야 함", () => {
    const { unmount } = render(<ScrollSync iframeRef={mockIframeRef} roomId={mockRoomId} />);
    const mockWs = global.WebSocket.mock.results[0].value;

    unmount();

    expect(mockWs.close).toHaveBeenCalled();
    expect(mockIframeRef.current.removeEventListener).toHaveBeenCalled();
    expect(mockIframeRef.current.contentDocument.removeEventListener).toHaveBeenCalled();
  });
});
