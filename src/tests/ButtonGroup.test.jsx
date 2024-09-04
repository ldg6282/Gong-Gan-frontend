import { useAtom } from "jotai";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent, screen } from "@testing-library/react";
import ButtonGroup from "../components/ButtonGroup";

vi.mock("jotai", () => ({
  atom: (initialValue) => ({ init: initialValue }),
  useAtom: vi.fn(),
}));

describe("ButtonGroup - handleSoundButtonClick 함수", () => {
  let setVolume;
  let setIsSoundButtonVisible;

  beforeEach(() => {
    setVolume = vi.fn();
    setIsSoundButtonVisible = vi.fn();

    useAtom.mockImplementation((atom) => {
      if (atom.init === true) return [true, setIsSoundButtonVisible];
      if (atom.init === 50) return [50, setVolume];
      return [atom.init, vi.fn()];
    });
  });

  it("볼륨이 0보다 클 때 음소거 동작을 수행한다", () => {
    render(<ButtonGroup />);
    fireEvent.click(screen.getByLabelText("Mute sound"));

    expect(setVolume).toHaveBeenCalledWith(0);
    expect(setIsSoundButtonVisible).toHaveBeenCalledWith(false);
  });

  it("볼륨이 0일 때 음소거를 해제한다", () => {
    useAtom.mockImplementation((atom) => {
      if (atom.init === true) return [false, setIsSoundButtonVisible];
      if (atom.init === 50) return [0, setVolume];
      return [atom.init, vi.fn()];
    });

    render(<ButtonGroup />);
    fireEvent.click(screen.getByLabelText("Unmute sound"));

    expect(setVolume).toHaveBeenCalledWith(expect.any(Number));
    expect(setIsSoundButtonVisible).toHaveBeenCalledWith(true);
  });

  it("사운드 버튼의 가시성을 올바르게 업데이트한다", () => {
    const { rerender } = render(<ButtonGroup />);

    expect(screen.getByLabelText("Mute sound")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Mute sound"));
    expect(setIsSoundButtonVisible).toHaveBeenCalledWith(false);

    useAtom.mockImplementation((atom) => {
      if (atom.init === true) return [false, setIsSoundButtonVisible];
      if (atom.init === 50) return [0, setVolume];
      return [atom.init, vi.fn()];
    });
    rerender(<ButtonGroup />);

    expect(screen.getByLabelText("Unmute sound")).toBeInTheDocument();
  });
});
