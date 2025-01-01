"use client";

import { useRef, useEffect, useCallback, useMemo, useState } from "react";
import { Antenna } from "../types";
import {
  drawPropagation,
  drawEmissionCircles,
  drawAntennas,
  drawTarget,
  drawGrid,
} from "../utils/drawing";

interface PhaseArrayCanvasProps {
  antennas: Antenna[];
  setAntennas: (antennas: Antenna[]) => void;
  target: { x: number; y: number } | null;
  setTarget: (target: { x: number; y: number } | null) => void;
  mode: "edit" | "target";
  showWaves: boolean;
  showEmissionCircles: boolean;
  waveSpeed: number;
}

export function PhaseArrayCanvas({
  antennas,
  setAntennas,
  target,
  setTarget,
  mode,
  showWaves,
  showEmissionCircles,
  waveSpeed,
}: PhaseArrayCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);
  const draggingAntennaRef = useRef<Antenna | null>(null);
  const isDraggingRef = useRef(false);
  const draggingPositionRef = useRef<{ x: number; y: number } | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number } | null>(null);
  const [draggingAntennaIndex, setDraggingAntennaIndex] = useState<
    number | null
  >(null);

  const offscreenCanvas = useMemo(() => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Enable alpha for transparency
      ctx.globalCompositeOperation = "source-over";
    }
    return canvas;
  }, []);

  const canvasToWorld = useCallback(
    (canvasX: number, canvasY: number, canvas: HTMLCanvasElement) => {
      const gridSize = 10;
      const wavelengthPixels = canvas.width / gridSize;
      const worldX = (canvasX - canvas.width / 2) / wavelengthPixels;
      const worldY = (canvas.height / 2 - canvasY) / wavelengthPixels;
      return { x: worldX, y: worldY };
    },
    []
  );

  const worldToCanvas = useCallback(
    (worldX: number, worldY: number, canvas: HTMLCanvasElement) => {
      const gridSize = 10;
      const wavelengthPixels = canvas.width / gridSize;
      const canvasX = worldX * wavelengthPixels + canvas.width / 2;
      const canvasY = canvas.height / 2 - worldY * wavelengthPixels;
      return { x: canvasX, y: canvasY };
    },
    []
  );

  const drawDraggingAntenna = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      canvas: HTMLCanvasElement,
      wavelengthPixels: number,
      x: number,
      y: number,
      offsetX: number,
      offsetY: number
    ) => {
      const { x: canvasX, y: canvasY } = worldToCanvas(x, y, canvas);

      // Draw helper circles
      ctx.strokeStyle = "rgba(100, 100, 100, 0.8)";
      ctx.setLineDash([5, 5]);

      const maxRadius = Math.max(canvas.width, canvas.height);
      for (
        let radius = 0.25;
        radius * wavelengthPixels <= maxRadius;
        radius += 0.25
      ) {
        ctx.beginPath();
        ctx.arc(canvasX, canvasY, radius * wavelengthPixels, 0, 2 * Math.PI);
        ctx.stroke();
      }

      ctx.setLineDash([]);

      // Draw ruler
      ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
      ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.font = "12px Arial";

      for (let i = -4; i <= 4; i++) {
        if (i === 0) continue;
        const rulerX = canvasX + i * wavelengthPixels;
        ctx.beginPath();
        ctx.moveTo(rulerX, canvasY - 10);
        ctx.lineTo(rulerX, canvasY + 10);
        ctx.stroke();
        ctx.fillText(`${Math.abs(i)}λ`, rulerX, canvasY - 15);
      }

      // Draw antenna
      ctx.strokeStyle = "rgba(0, 0, 255, 0.8)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(canvasX, canvasY, wavelengthPixels / 4, 0, 2 * Math.PI);
      ctx.stroke();

      // Draw crosshairs
      ctx.beginPath();
      ctx.moveTo(canvasX - wavelengthPixels / 4, canvasY);
      ctx.lineTo(canvasX + wavelengthPixels / 4, canvasY);
      ctx.moveTo(canvasX, canvasY - wavelengthPixels / 4);
      ctx.lineTo(canvasX, canvasY + wavelengthPixels / 4);
      ctx.stroke();

      // Draw grab point
      ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
      ctx.beginPath();
      ctx.arc(
        canvasX + offsetX * wavelengthPixels,
        canvasY - offsetY * wavelengthPixels,
        5,
        0,
        2 * Math.PI
      );
      ctx.fill();

      // Draw position info
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(canvasX + 10, canvasY + 10, 120, 40);
      ctx.fillStyle = "white";
      ctx.font = "12px Arial";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(`X: ${x.toFixed(2)}λ`, canvasX + 15, canvasY + 15);
      ctx.fillText(`Y: ${y.toFixed(2)}λ`, canvasX + 15, canvasY + 30);
    },
    [worldToCanvas]
  );

  const draw = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      canvas: HTMLCanvasElement,
      time: number
    ) => {
      const gridSize = 10;
      const wavelengthPixels = canvas.width / gridSize;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      drawGrid(ctx, canvas, gridSize);

      // Draw zero point indicator
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 5, 0, 2 * Math.PI);
      ctx.fill();

      if (antennas.length > 0) {
        if (showWaves) {
          drawPropagation(
            ctx,
            canvas,
            antennas,
            wavelengthPixels,
            time,
            waveSpeed
          );
        }

        if (showEmissionCircles) {
          drawEmissionCircles(
            ctx,
            canvas,
            antennas,
            wavelengthPixels,
            time,
            waveSpeed
          );
        }

        drawAntennas(
          ctx,
          antennas,
          wavelengthPixels,
          isDraggingRef.current,
          draggingAntennaIndex
        );
      }

      drawTarget(ctx, target, wavelengthPixels);

      if (
        isDraggingRef.current &&
        draggingPositionRef.current &&
        dragOffsetRef.current
      ) {
        drawDraggingAntenna(
          ctx,
          canvas,
          wavelengthPixels,
          draggingPositionRef.current.x,
          draggingPositionRef.current.y,
          dragOffsetRef.current.x,
          dragOffsetRef.current.y
        );
      }
    },
    [
      antennas,
      target,
      showWaves,
      showEmissionCircles,
      waveSpeed,
      drawDraggingAntenna,
      draggingAntennaIndex,
    ]
  );

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !offscreenCanvas) return;

    const ctx = canvas.getContext("2d");
    const offscreenCtx = offscreenCanvas.getContext("2d");
    if (!ctx || !offscreenCtx) return;

    timeRef.current += waveSpeed * 0.01;

    // Ensure consistent context states before drawing
    offscreenCtx.setTransform(1, 0, 0, 1, 0, 0);
    offscreenCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

    // Draw everything on the offscreen canvas
    draw(offscreenCtx, offscreenCanvas, timeRef.current);

    // Clear the visible canvas and copy from offscreen
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(offscreenCanvas, 0, 0);

    animationRef.current = requestAnimationFrame(animate);
  }, [draw, waveSpeed, offscreenCanvas]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !offscreenCanvas) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const aspectRatio = 4 / 3;
    let canvasWidth = containerWidth;
    let canvasHeight = containerWidth / aspectRatio;

    if (canvasHeight > containerHeight) {
      canvasHeight = containerHeight;
      canvasWidth = containerHeight * aspectRatio;
    }

    // Update both canvases with the same dimensions
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    offscreenCanvas.width = canvasWidth;
    offscreenCanvas.height = canvasHeight;

    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
  }, [offscreenCanvas]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const offscreenCtx = offscreenCanvas.getContext("2d");
    if (!ctx || !offscreenCtx) return;

    resizeCanvas();

    const resizeObserver = new ResizeObserver(resizeCanvas);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Start the animation
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [animate, resizeCanvas, offscreenCanvas]);

  const handleCanvasMouseDown = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const canvasX = (event.clientX - rect.left) * (canvas.width / rect.width);
      const canvasY =
        (event.clientY - rect.top) * (canvas.height / rect.height);
      const { x, y } = canvasToWorld(canvasX, canvasY, canvas);

      if (mode === "edit") {
        for (let i = 0; i < antennas.length; i++) {
          const antenna = antennas[i];
          const distance = Math.sqrt(
            (x - antenna.x) ** 2 + (y - antenna.y) ** 2
          );
          if (distance < 0.25) {
            draggingAntennaRef.current = antenna;
            isDraggingRef.current = true;
            draggingPositionRef.current = { x: antenna.x, y: antenna.y };
            dragOffsetRef.current = { x: x - antenna.x, y: y - antenna.y };
            setDraggingAntennaIndex(i);
            return;
          }
        }
        setAntennas([...antennas, { x, y, phase: 0 }]);
      } else if (mode === "target") {
        setTarget({ x, y });
      }
    },
    [mode, antennas, setAntennas, setTarget, canvasToWorld]
  );

  const handleCanvasMouseMove = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas || !isDraggingRef.current || !dragOffsetRef.current) return;

      const rect = canvas.getBoundingClientRect();
      const canvasX = (event.clientX - rect.left) * (canvas.width / rect.width);
      const canvasY =
        (event.clientY - rect.top) * (canvas.height / rect.height);
      const { x, y } = canvasToWorld(canvasX, canvasY, canvas);
      draggingPositionRef.current = {
        x: x - dragOffsetRef.current.x,
        y: y - dragOffsetRef.current.y,
      };
    },
    [canvasToWorld]
  );

  const handleCanvasMouseUp = useCallback(() => {
    if (draggingAntennaRef.current && draggingPositionRef.current) {
      const updatedAntennas = antennas.map((antenna, index) =>
        index === draggingAntennaIndex
          ? {
              ...antenna,
              x: draggingPositionRef.current!.x,
              y: draggingPositionRef.current!.y,
            }
          : antenna
      );
      setAntennas(updatedAntennas);
    }
    draggingAntennaRef.current = null;
    isDraggingRef.current = false;
    draggingPositionRef.current = null;
    dragOffsetRef.current = null;
    setDraggingAntennaIndex(null);
  }, [antennas, setAntennas, draggingAntennaIndex]);

  return (
    <div ref={containerRef} className="w-full h-full bg-gray-50">
      {useMemo(
        () => (
          <canvas
            ref={canvasRef}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            className="mx-auto"
          />
        ),
        [handleCanvasMouseDown, handleCanvasMouseMove, handleCanvasMouseUp]
      )}
    </div>
  );
}
