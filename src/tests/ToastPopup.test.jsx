import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAtom } from "jotai";
import ToastPopup from "../components/ToastPopup";

vi.mock("jotai", () => ({
  atom: (initialValue) => ({ init: initialValue }),
  useAtom: vi.fn(),
}));

describe("ToastPopup 컴포넌트", () => {
  let setToastMock;

  beforeEach(() => {
    setToastMock = vi.fn();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("토스트 메시지가 없으면 아무것도 렌더링하지 않습니다", () => {
    useAtom.mockReturnValue([{ message: "" }, setToastMock]);
    const { container } = render(<ToastPopup />);
    expect(container.firstChild).toBeNull();
  });

  it("토스트 메시지가 있으면 메시지를 렌더링합니다", () => {
    const testMessage = "테스트 메시지";
    useAtom.mockReturnValue([{ message: testMessage }, setToastMock]);
    render(<ToastPopup />);
    expect(screen.getByText(testMessage)).toBeDefined();
  });

  it("1.5초 후에 토스트 메시지를 제거합니다", () => {
    const testMessage = "테스트 메시지";
    useAtom.mockReturnValue([{ message: testMessage }, setToastMock]);
    render(<ToastPopup />);

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(setToastMock).toHaveBeenCalledWith(expect.objectContaining({ message: "" }));
  });

  it("toast가 null일 때 오류 없이 처리합니다", () => {
    useAtom.mockReturnValue([null, setToastMock]);
    const { container } = render(<ToastPopup />);
    expect(container.firstChild).toBeNull();
  });
});
