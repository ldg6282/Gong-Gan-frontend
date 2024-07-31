import { useEffect, useRef, useCallback, useState } from "react";
import { useAtom } from "jotai";
import { userIdAtom, seletedColorAtom, penToolAtom } from "../atoms/atoms";

export default function DrawingSync({ iframeRef, roomId }) {
  const [isDrawing, setIsDrawing] = useState(false);
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const currentLineRef = useRef(null);
  const linesRef = useRef([]);
  const [color] = useAtom(seletedColorAtom);
  const [userId] = useAtom(userIdAtom);
  const [isPenToolActive] = useAtom(penToolAtom);

  const connectWebSocket = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) return;

    const WS_SERVER_URL = import.meta.env.VITE_WS_SERVER_URL;
    const ws = new WebSocket(WS_SERVER_URL);

    ws.onopen = () => ws.send(JSON.stringify({ type: "joinRoom", roomId, userId }));
    ws.onmessage = handleWebSocketMessage;
    socketRef.current = ws;
  }, [roomId, userId]);

  useEffect(() => {
    connectWebSocket();
    const reconnectInterval = setInterval(() => {
      if (socketRef.current?.readyState === WebSocket.CLOSED) connectWebSocket();
    }, 5000);
    return () => {
      clearInterval(reconnectInterval);
      socketRef.current?.close();
    };
  }, [connectWebSocket]);

  const sendDrawingEvent = useCallback(
    (x, y, isStarting, lineId, isDrawingContinue = true) => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        const canvas = canvasRef.current;
        socketRef.current.send(
          JSON.stringify({
            type: "drawEvent",
            roomId,
            userId,
            relativeX: x / canvas.width,
            relativeY: y / canvas.height,
            color,
            isStarting,
            isDrawing: isDrawingContinue,
            lineId,
          }),
        );
      }
    },
    [roomId, userId, color],
  );

  const drawLine = useCallback((ctx, line) => {
    ctx.beginPath();
    ctx.moveTo(line.points[0].x, line.points[0].y);
    line.points.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
    ctx.strokeStyle = line.color;
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalAlpha = line.opacity;
    ctx.stroke();
  }, []);

  const redrawCanvas = useCallback(() => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    linesRef.current.forEach((line) => drawLine(ctx, line));
  }, [drawLine]);

  const startFadeOut = useCallback(
    (lineId) => {
      setTimeout(() => {
        const startTime = performance.now();
        const duration = 1000;

        const fade = (currentTime) => {
          const line = linesRef.current.find((l) => l.id === lineId);
          if (!line) return;

          const elapsed = currentTime - startTime;
          line.opacity = Math.max(0, 1 - elapsed / duration);

          if (line.opacity > 0) {
            redrawCanvas();
            requestAnimationFrame(fade);
          } else {
            linesRef.current = linesRef.current.filter((l) => l.id !== lineId);
            redrawCanvas();
          }
        };

        requestAnimationFrame(fade);
      }, 1000);
    },
    [redrawCanvas],
  );

  const startDrawing = useCallback(
    (e) => {
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
    },
    [isPenToolActive, color, sendDrawingEvent, drawLine],
  );

  const draw = useCallback(
    (e) => {
      if (!isDrawing || !isPenToolActive || !currentLineRef.current) return;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      currentLineRef.current.points.push({ x, y });
      drawLine(canvas.getContext("2d"), currentLineRef.current);
      sendDrawingEvent(x, y, false, currentLineRef.current.id);
    },
    [isDrawing, isPenToolActive, sendDrawingEvent, drawLine],
  );

  const stopDrawing = useCallback(() => {
    if (isDrawing && currentLineRef.current) {
      setIsDrawing(false);
      linesRef.current.push(currentLineRef.current);

      const lastPoint = currentLineRef.current.points[currentLineRef.current.points.length - 1];
      sendDrawingEvent(lastPoint.x, lastPoint.y, false, currentLineRef.current.id, false);

      startFadeOut(currentLineRef.current.id);
      currentLineRef.current = null;
    }
  }, [isDrawing, sendDrawingEvent, startFadeOut]);

  const handleWebSocketMessage = useCallback(
    (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "drawEvent" && data.userId !== userId) {
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
    },
    [userId, drawLine, startFadeOut],
  );

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
  }, [startDrawing, draw, stopDrawing]);

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

    window.addEventListener("resize", resizeCanvas);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [iframeRef, redrawCanvas]);

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
