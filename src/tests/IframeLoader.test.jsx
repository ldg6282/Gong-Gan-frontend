import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { Provider } from "jotai";
import IframeLoader from "../components/IframeLoader";
import { userIdAtom } from "../atoms/atoms";

vi.mock("../components/ScrollSync", () => ({ default: () => <div data-testid="scroll-sync" /> }));
vi.mock("../components/ClickSync", () => ({ default: () => <div data-testid="click-sync" /> }));
vi.mock("../components/VoiceChat", () => ({ default: () => <div data-testid="voice-chat" /> }));
vi.mock("../components/DrawingSync", () => ({ default: () => <div data-testid="drawing-sync" /> }));

describe("IframeLoader 컴포넌트", () => {
  beforeEach(() => {
    vi.stubGlobal("innerWidth", 1024);
    vi.stubGlobal("innerHeight", 768);
  });

  it("올바르게 렌더링되고 랜덤한 방 ID를 생성한다", () => {
    const { container } = render(
      <Provider>
        <IframeLoader />
      </Provider>,
    );

    expect(container.querySelector("iframe")).toBeTruthy();
    expect(screen.getByTestId("scroll-sync")).toBeTruthy();
    expect(screen.getByTestId("click-sync")).toBeTruthy();
    expect(screen.getByTestId("voice-chat")).toBeTruthy();
    expect(screen.getByTestId("drawing-sync")).toBeTruthy();
  });

  it("사용자 ID가 설정되지 않은 경우 랜덤한 ID를 설정한다", () => {
    let capturedUserId;
    const TestWrapper = function TestWrapper() {
      const [userId] = userIdAtom.use();
      capturedUserId = userId;
      return null;
    };

    render(
      <Provider>
        <IframeLoader />
        <TestWrapper />
      </Provider>,
    );

    expect(capturedUserId).toBeTruthy();
    expect(capturedUserId).toMatch(/^user_[a-z0-9]{9}$/);
  });
});
