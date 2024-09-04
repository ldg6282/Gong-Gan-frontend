import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "../components/App";

vi.mock("../components/Header", () => ({
  default: ({ roomId }) => <div data-testid="header">Header: {roomId}</div>,
}));

vi.mock("../components/IframeLoader", () => ({
  default: ({ roomId }) => <div data-testid="iframe-loader">IframeLoader: {roomId}</div>,
}));

describe("App Component", () => {
  const mockRoomId = "test-room-123";

  it("충돌 없이 렌더링됩니다", () => {
    render(<App roomId={mockRoomId} />);
    expect(screen.getByTestId("header")).toBeDefined();
    expect(screen.getByTestId("iframe-loader")).toBeDefined();
  });

  it("Header와 IframeLoader에 roomId prop을 전달합니다", () => {
    render(<App roomId={mockRoomId} />);
    expect(screen.getByTestId("header").textContent).toContain(`Header: ${mockRoomId}`);
    expect(screen.getByTestId("iframe-loader").textContent).toContain(
      `IframeLoader: ${mockRoomId}`,
    );
  });

  it("올바른 레이아웃 구조를 가집니다", () => {
    const { container } = render(<App roomId={mockRoomId} />);

    const rootDiv = container.firstChild;
    expect(rootDiv.className).toContain("fixed inset-0 flex flex-col h-screen w-screen bg-white");

    expect(screen.getByTestId("header")).toBeDefined();

    const iframeLoaderElement = screen.getByTestId("iframe-loader");
    const iframeLoaderParent = iframeLoaderElement.parentElement;
    expect(iframeLoaderParent.className).toContain("flex-grow w-full");
  });
});
