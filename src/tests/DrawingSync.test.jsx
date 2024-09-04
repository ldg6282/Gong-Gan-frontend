import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import { useAtom } from "jotai";
import DrawingSync from "../components/DrawingSync";

vi.mock("jotai", () => ({
  atom: vi.fn(),
  useAtom: vi.fn(),
}));

vi.mock("../atoms/atoms", () => ({
  userIdAtom: "mocked-user-id-atom",
  seletedColorAtom: "mocked-color-atom",
  penToolAtom: "mocked-pen-tool-atom",
}));

const WS_SERVER_URL = "https://gong-gan.onrender.com";

class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = WebSocket.CONNECTING;
    this.send = vi.fn();
    this.close = vi.fn();
    this.onopen = null;
    this.onmessage = null;

    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      if (this.onopen) this.onopen();
    }, 0);
  }
}

let mockWebSocket;
global.WebSocket = vi.fn().mockImplementation((url) => {
  mockWebSocket = new MockWebSocket(url);
  return mockWebSocket;
});

function setup() {
  const mockIframeRef = {
    current: {
      getBoundingClientRect: vi.fn(() => ({ width: 800, height: 600 })),
      contentWindow: {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    },
  };
  const mockRoomId = "test-room";
  const mockUserId = "test-user";
  const mockColor = "#000000";
  const mockIsPenToolActive = true;

  useAtom.mockImplementation((atom) => {
    if (atom === "mocked-user-id-atom") return [mockUserId];
    if (atom === "mocked-color-atom") return [mockColor];
    if (atom === "mocked-pen-tool-atom") return [mockIsPenToolActive];
    return [];
  });

  return { mockIframeRef, mockRoomId, mockUserId, mockColor };
}

describe("DrawingSync", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "ResizeObserver",
      vi.fn(() => ({
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      })),
    );

    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      clearRect: vi.fn(),
    }));

    vi.stubGlobal("import", { meta: { env: { VITE_WS_SERVER_URL: WS_SERVER_URL } } });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("캔버스 크기가 iframe 크기에 맞게 조정되어야 함", async () => {
    const { mockIframeRef, mockRoomId } = setup();
    let resizeCallback;
    vi.stubGlobal(
      "ResizeObserver",
      vi.fn((cb) => {
        resizeCallback = cb;
        return {
          observe: vi.fn(),
          unobserve: vi.fn(),
          disconnect: vi.fn(),
        };
      }),
    );

    render(<DrawingSync iframeRef={mockIframeRef} roomId={mockRoomId} />);

    await act(async () => {
      resizeCallback([{ contentRect: { width: 800, height: 600 } }]);
    });

    const canvas = document.querySelector("canvas");
    expect(canvas.width).toBe(800);
    expect(canvas.height).toBe(600);
  });
});
