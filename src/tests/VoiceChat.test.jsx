import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import { useAtom } from "jotai";
import VoiceChat from "../components/VoiceChat";

vi.mock("jotai", () => ({
  atom: vi.fn(),
  useAtom: vi.fn(),
}));

vi.mock("../atoms/atoms", () => ({
  userIdAtom: "mocked-user-id-atom",
  micButtonAtom: "mocked-mic-button-atom",
  soundButtonAtom: "mocked-sound-button-atom",
  volumeAtom: "mocked-volume-atom",
  micVolumeAtom: "mocked-mic-volume-atom",
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
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
}

global.WebSocket = vi.fn().mockImplementation((url) => MockWebSocket(url));

const mockPeerConnection = {
  createOffer: vi.fn().mockResolvedValue({ type: "offer" }),
  setLocalDescription: vi.fn().mockResolvedValue(undefined),
  setRemoteDescription: vi.fn().mockResolvedValue(undefined),
  createAnswer: vi.fn().mockResolvedValue({ type: "answer" }),
  addIceCandidate: vi.fn().mockResolvedValue(undefined),
  onicecandidate: null,
  ontrack: null,
  addTrack: vi.fn(),
  close: vi.fn(),
};

global.RTCPeerConnection = vi.fn().mockImplementation(() => mockPeerConnection);
global.RTCSessionDescription = vi.fn((config) => config);
global.RTCIceCandidate = vi.fn((config) => config);

const mockAudioTrack = { enabled: true };
const mockMediaStream = {
  getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }]),
  getAudioTracks: vi.fn().mockReturnValue([mockAudioTrack]),
  removeTrack: vi.fn(),
  addTrack: vi.fn(),
};

global.navigator.mediaDevices = {
  getUserMedia: vi.fn().mockResolvedValue(mockMediaStream),
};

global.AudioContext = vi.fn().mockImplementation(() => ({
  createMediaStreamSource: vi.fn().mockReturnValue({ connect: vi.fn() }),
  createGain: vi.fn().mockReturnValue({ connect: vi.fn(), gain: { setValueAtTime: vi.fn() } }),
  createMediaStreamDestination: vi.fn().mockReturnValue({ stream: mockMediaStream }),
  currentTime: 0,
  close: vi.fn(),
}));

let mockIsMicActive = true;
const mockSetIsMicActive = vi.fn((newValue) => {
  mockIsMicActive = newValue;
  mockAudioTrack.enabled = newValue;
});

function setup() {
  const mockRoomId = "test-room";
  const mockUserId = "test-user";
  const mockIsSoundActive = true;
  const mockVolume = 50;
  const mockMicVolume = 50;

  useAtom.mockImplementation((atom) => {
    switch (atom) {
      case "mocked-user-id-atom":
        return [mockUserId];
      case "mocked-mic-button-atom":
        return [mockIsMicActive, mockSetIsMicActive];
      case "mocked-sound-button-atom":
        return [mockIsSoundActive, vi.fn()];
      case "mocked-volume-atom":
        return [mockVolume];
      case "mocked-mic-volume-atom":
        return [mockMicVolume];
      default:
        return [];
    }
  });

  return { mockRoomId, mockUserId };
}

describe("VoiceChat", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockAudioTrack.enabled = true;
    mockIsMicActive = true;
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("마운트 시 WebSocket 연결을 초기화해야 함", async () => {
    const { mockRoomId } = setup();
    await act(async () => {
      render(<VoiceChat roomId={mockRoomId} />);
    });
    expect(global.WebSocket).toHaveBeenCalledWith(WS_SERVER_URL);
  });

  it("WebSocket 연결 시 방 참가 메시지를 보내야 함", async () => {
    const { mockRoomId, mockUserId } = setup();
    let onOpenCallback;
    global.WebSocket = vi.fn().mockImplementation(() => ({
      send: vi.fn(),
      close: vi.fn(),
      set onopen(cb) {
        onOpenCallback = cb;
      },
    }));

    await act(async () => {
      render(<VoiceChat roomId={mockRoomId} />);
    });

    await act(async () => {
      onOpenCallback();
    });

    const mockWs = global.WebSocket.mock.results[0].value;
    expect(mockWs.send).toHaveBeenCalledWith(
      JSON.stringify({ type: "joinRoom", roomId: mockRoomId, userId: mockUserId }),
    );
  });

  it("로컬 스트림을 시작하고 PeerConnection을 설정해야 함", async () => {
    const { mockRoomId } = setup();
    let onOpenCallback;
    global.WebSocket = vi.fn().mockImplementation(() => ({
      send: vi.fn(),
      close: vi.fn(),
      set onopen(cb) {
        onOpenCallback = cb;
      },
    }));

    await act(async () => {
      render(<VoiceChat roomId={mockRoomId} />);
    });

    await act(async () => {
      onOpenCallback();
    });

    expect(global.navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
    expect(global.RTCPeerConnection).toHaveBeenCalled();
  });

  it("마이크 상태 변경 시 로컬 스트림을 업데이트해야 함", async () => {
    const { mockRoomId } = setup();
    let onOpenCallback;
    global.WebSocket = vi.fn().mockImplementation(() => ({
      send: vi.fn(),
      close: vi.fn(),
      set onopen(cb) {
        onOpenCallback = cb;
      },
    }));

    const { rerender } = render(<VoiceChat roomId={mockRoomId} />);

    await act(async () => {
      onOpenCallback();
    });

    await act(async () => {
      mockSetIsMicActive(false);
    });

    rerender(<VoiceChat roomId={mockRoomId} />);

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(mockAudioTrack.enabled).toBe(false);
  });

  it("WebRTC 메시지를 올바르게 처리해야 함", async () => {
    const { mockRoomId } = setup();
    let onMessageCallback;
    let onOpenCallback;
    const mockWs = {
      send: vi.fn(),
      close: vi.fn(),
      set onmessage(cb) {
        onMessageCallback = cb;
      },
      set onopen(cb) {
        onOpenCallback = cb;
      },
    };
    global.WebSocket = vi.fn().mockImplementation(() => mockWs);

    await act(async () => {
      render(<VoiceChat roomId={mockRoomId} />);
    });

    await act(async () => {
      onOpenCallback();
    });

    await act(async () => {
      onMessageCallback({
        data: JSON.stringify({ type: "webrtcOffer", offer: { type: "offer" } }),
      });
    });

    expect(mockPeerConnection.setRemoteDescription).toHaveBeenCalled();
    expect(mockPeerConnection.createAnswer).toHaveBeenCalled();

    await act(async () => {
      onMessageCallback({
        data: JSON.stringify({ type: "webrtcAnswer", answer: { type: "answer" } }),
      });
    });
    expect(mockPeerConnection.setRemoteDescription).toHaveBeenCalled();

    await act(async () => {
      onMessageCallback({ data: JSON.stringify({ type: "webrtcIceCandidate", candidate: {} }) });
    });
    expect(mockPeerConnection.addIceCandidate).toHaveBeenCalled();
  });

  it("언마운트 시 정리 작업을 수행해야 함", async () => {
    const { mockRoomId } = setup();
    let onOpenCallback;
    global.WebSocket = vi.fn().mockImplementation(() => ({
      send: vi.fn(),
      close: vi.fn(),
      set onopen(cb) {
        onOpenCallback = cb;
      },
    }));

    const { unmount } = render(<VoiceChat roomId={mockRoomId} />);

    await act(async () => {
      onOpenCallback();
    });

    await act(async () => {
      unmount();
    });

    const mockWs = global.WebSocket.mock.results[0].value;
    expect(mockWs.close).toHaveBeenCalled();
    expect(mockMediaStream.getTracks).toHaveBeenCalled();
    expect(mockMediaStream.getTracks()[0].stop).toHaveBeenCalled();
    expect(global.AudioContext.mock.results[0].value.close).toHaveBeenCalled();
    expect(mockPeerConnection.close).toHaveBeenCalled();
  });
});
