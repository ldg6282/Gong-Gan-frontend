import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import { useAtom } from "jotai";
import Header from "../components/Header";

vi.mock("jotai", () => ({
  atom: (initialValue) => ({ init: initialValue }),
  useAtom: vi.fn(),
}));

Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

describe("Header 컴포넌트", () => {
  const mockRoomId = "test-room-123";
  let setToastMock;

  beforeEach(() => {
    setToastMock = vi.fn();
    useAtom.mockImplementation((atom) => {
      if (atom.toString().includes("toastAtom")) {
        return [null, setToastMock];
      }
      return [null, vi.fn()];
    });
    navigator.clipboard.writeText.mockClear();
  });

  it("Header 컴포넌트가 올바르게 렌더링됩니다", () => {
    render(<Header roomId={mockRoomId} />);
    expect(screen.getByText("방 번호 복사")).toBeInTheDocument();
  });

  // it("방 번호가 클립보드에 복사되고 성공 메시지가 표시됩니다", () => {
  //   // 비동기 작업이 성공적으로 완료되도록 모킹
  //   navigator.clipboard.writeText.mockImplementation(() => Promise.resolve());

  //   render(<Header roomId={mockRoomId} />);

  //   const copyButton = screen.getByText("방 번호 복사");
  //   fireEvent.click(copyButton);

  //   expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockRoomId);
  //   expect(setToastMock).toHaveBeenCalledWith(
  //     expect.objectContaining({
  //       message: "방 번호가 클립보드에 복사되었습니다.",
  //       type: "success",
  //     }),
  //   );
  // });

  // it("클립보드 복사 실패 시 오류 메시지가 표시됩니다", () => {
  //   navigator.clipboard.writeText.mockImplementation(() => Promise.reject(new Error("복사 실패")));

  //   render(<Header roomId={mockRoomId} />);

  //   const copyButton = screen.getByText("방 번호 복사");
  //   fireEvent.click(copyButton);

  //   expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockRoomId);
  //   expect(setToastMock).toHaveBeenCalledWith(
  //     expect.objectContaining({
  //       message: "방 번호 복사에 실패했습니다.",
  //       type: "error",
  //     }),
  //   );
  // });

  it("roomId가 없으면 클립보드 복사를 시도하지 않습니다", async () => {
    render(<Header />);

    const copyButton = screen.getByText("방 번호 복사");
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
      expect(setToastMock).not.toHaveBeenCalled();
    });
  });
});
