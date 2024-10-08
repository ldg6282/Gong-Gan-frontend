import { useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";

import { roomIdAtom, userIdAtom, seletedColorAtom, penToolAtom } from "../atoms/atoms";
import useWebSocket from "../hooks/useWebSocket";

export default function DrawingSync({ iframeRef }) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [roomId] = useAtom(roomIdAtom);
  const [color] = useAtom(seletedColorAtom);
  const [userId] = useAtom(userIdAtom);
  const [isPenToolActive] = useAtom(penToolAtom);
  const { sendMessage, setOnMessage } = useWebSocket();

  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const currentLineRef = useRef(null);
  const linesRef = useRef([]);

  function sendDrawingEvent(x, y, isStarting, lineId, isDrawingContinue = true) {
    sendMessage({
      type: "drawEvent",
      roomId,
      userId,
      relativeX: x / canvasRef.current.width,
      relativeY: y / canvasRef.current.height,
      color,
      isStarting,
      isDrawing: isDrawingContinue,
      lineId,
    });
  }

  function drawLine(ctx, line) {
    ctx.beginPath();
    ctx.moveTo(line.points[0].x, line.points[0].y);
    line.points.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
    ctx.strokeStyle = line.color;
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalAlpha = line.opacity;
    ctx.stroke();
  }

  function redrawCanvas() {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    linesRef.current.forEach((line) => drawLine(ctx, line));
  }

  function startFadeOut(lineId) {
    setTimeout(() => {
      const startTime = performance.now();
      const duration = 1000;

      const fade = (currentTime) => {
        const line = linesRef.current.find((storedLine) => storedLine.id === lineId);
        if (!line) return;

        const elapsed = currentTime - startTime;
        line.opacity = Math.max(0, 1 - elapsed / duration);

        if (line.opacity > 0) {
          redrawCanvas();
          requestAnimationFrame(fade);
        } else {
          linesRef.current = linesRef.current.filter((storedLine) => storedLine.id !== lineId);
          redrawCanvas();
        }
      };

      requestAnimationFrame(fade);
    }, 1000);
  }

  function startDrawing(e) {
    if (!isPenToolActive) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setIsDrawing(true);
    const lineId = Date.now().toString();
    currentLineRef.current = { id: lineId, points: [{ x, y }], color, opacity: 1 };

    drawLine(canvas.getContext("2d"), currentLineRef.current);
    sendDrawingEvent(x, y, true, lineId);
  }

  function draw(event) {
    if (!isDrawing || !isPenToolActive || !currentLineRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    currentLineRef.current.points.push({ x, y });
    drawLine(canvas.getContext("2d"), currentLineRef.current);
    sendDrawingEvent(x, y, false, currentLineRef.current.id);
  }

  function stopDrawing() {
    if (isDrawing && currentLineRef.current) {
      setIsDrawing(false);
      linesRef.current.push(currentLineRef.current);

      const lastPoint = currentLineRef.current.points[currentLineRef.current.points.length - 1];
      sendDrawingEvent(lastPoint.x, lastPoint.y, false, currentLineRef.current.id, false);

      startFadeOut(currentLineRef.current.id);
      currentLineRef.current = null;
    }
  }

  useEffect(() => {
    setOnMessage((event) => {
      const data = JSON.parse(event.data);
      if (data.type === "drawEvent") {
        const canvas = canvasRef.current;
        const x = data.relativeX * canvas.width;
        const y = data.relativeY * canvas.height;

        if (data.isStarting) {
          currentLineRef.current = {
            id: data.lineId,
            points: [{ x, y }],
            color: data.color,
            opacity: 1,
          };
        } else if (currentLineRef.current) {
          currentLineRef.current.points.push({ x, y });
        }

        drawLine(canvas.getContext("2d"), currentLineRef.current);

        if (!data.isDrawing && currentLineRef.current) {
          linesRef.current.push(currentLineRef.current);
          startFadeOut(currentLineRef.current.id);
          currentLineRef.current = null;
        }
      }
    });
  }, [setOnMessage]);

  useEffect(() => {
    const container = containerRef.current;
    container.addEventListener("mousedown", startDrawing);
    container.addEventListener("mousemove", draw);
    container.addEventListener("mouseup", stopDrawing);
    container.addEventListener("mouseleave", stopDrawing);

    return () => {
      container.removeEventListener("mousedown", startDrawing);
      container.removeEventListener("mousemove", draw);
      container.removeEventListener("mouseup", stopDrawing);
      container.removeEventListener("mouseleave", stopDrawing);
    };
  }, [isPenToolActive, color, isDrawing]);

  useEffect(() => {
    function resizeCanvas() {
      if (iframeRef.current) {
        const rect = iframeRef.current.getBoundingClientRect();
        containerRef.current.style.width = `${rect.width}px`;
        containerRef.current.style.height = `${rect.height}px`;
        canvasRef.current.width = rect.width;
        canvasRef.current.height = rect.height;
        redrawCanvas();
      }
    }

    const resizeObserver = new ResizeObserver(resizeCanvas);

    if (iframeRef.current) {
      resizeObserver.observe(iframeRef.current);
    }

    return () => {
      if (iframeRef.current) {
        resizeObserver.unobserve(iframeRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [iframeRef]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: isPenToolActive ? "auto" : "none",
        zIndex: isPenToolActive ? 10000 : 9999,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
