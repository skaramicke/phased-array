'use client'

import { useRef, useEffect, useCallback, useMemo, useState } from 'react'
import { Antenna } from '../types'
import {
  drawPropagation,
  drawEmissionCircles,
  drawAntennas,
  drawTarget,
  drawGrid,
  drawToolbox,
  drawDraggingAntenna,
  drawAntennaIcon
} from '../utils/drawing'

type TouchStartHandler = (event: TouchEvent) => void;
type TouchMoveHandler = (event: TouchEvent) => void;
type TouchEndHandler = (event: TouchEvent) => void;

interface PhaseArrayCanvasProps {
  antennas: Antenna[]
  setAntennas: React.Dispatch<React.SetStateAction<Antenna[]>>
  target: { x: number; y: number } | null
  setTarget: (target: { x: number; y: number } | null) => void
  mode: 'edit' | 'target'
  showWaves: boolean
  showEmissionCircles: boolean
  waveSpeed: number
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
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const animationRef = useRef<number | null>(null)
  const timeRef = useRef<number>(0)
  const draggingAntennaRef = useRef<Antenna | null>(null)
  const isDraggingRef = useRef(false)
  const draggingPositionRef = useRef<{ x: number; y: number } | null>(null)
  const dragOffsetRef = useRef<{ x: number; y: number } | null>(null)
  const [draggingAntennaIndex, setDraggingAntennaIndex] = useState<number | null>(null);
  const [isNewAntenna, setIsNewAntenna] = useState(false);
  const [showTrashCan, setShowTrashCan] = useState(false);
  const cursorPositionRef = useRef<{ x: number, y: number } | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const canvasToWorld = useCallback((canvasX: number, canvasY: number, canvas: HTMLCanvasElement) => {
    const gridSize = 10
    const wavelengthPixels = canvas.width / gridSize
    const worldX = (canvasX - canvas.width / 2) / wavelengthPixels
    const worldY = (canvas.height / 2 - canvasY) / wavelengthPixels
    return { x: worldX, y: worldY }
  }, [])

  const worldToCanvas = useCallback((worldX: number, worldY: number, canvas: HTMLCanvasElement) => {
    const gridSize = 10
    const wavelengthPixels = canvas.width / gridSize
    const canvasX = worldX * wavelengthPixels + canvas.width / 2
    const canvasY = canvas.height / 2 - worldY * wavelengthPixels
    return { x: canvasX, y: canvasY }
  }, [])

  const isOverToolbox = useCallback((x: number, y: number, canvas: HTMLCanvasElement): boolean => {
    const toolboxSize = canvas.width / 8;
    const margin = 16;
    return x >= canvas.width - toolboxSize - margin && x <= canvas.width - margin &&
           y >= canvas.height - toolboxSize - margin && y <= canvas.height - margin;
  }, []);

  const draw = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      canvas: HTMLCanvasElement,
      time: number,
      cursorPosition: { x: number; y: number } | null
    ) => {
      const gridSize = 10;
      const wavelengthPixels = canvas.width / gridSize;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      drawGrid(ctx, canvas, gridSize);

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

      if (
        cursorPosition &&
        !isOverToolbox(cursorPosition.x, cursorPosition.y, canvas)
      ) {
        drawTarget(ctx, target, wavelengthPixels);
      }

      if (
        isDraggingRef.current &&
        draggingPositionRef.current &&
        dragOffsetRef.current
      ) {
        if (
          cursorPosition &&
          isOverToolbox(cursorPosition.x, cursorPosition.y, canvas)
        ) {
          // Draw antenna symbol at cursor position when over toolbox
          drawAntennaIcon(
            ctx,
            cursorPosition.x,
            cursorPosition.y,
            wavelengthPixels / 2
          );
        } else {
          // Draw dragging antenna
          drawDraggingAntenna(
            ctx,
            canvas,
            wavelengthPixels,
            draggingPositionRef.current.x,
            draggingPositionRef.current.y,
            dragOffsetRef.current.x,
            dragOffsetRef.current.y,
            worldToCanvas
          );
        }
      }

      drawToolbox(ctx, canvas, wavelengthPixels, showTrashCan);
    },
    [
      antennas,
      target,
      showWaves,
      showEmissionCircles,
      waveSpeed,
      draggingAntennaIndex,
      showTrashCan,
      isOverToolbox,
      worldToCanvas,
    ]
  );

  const animate = useCallback(() => {
    const canvas = canvasRef.current
    const offscreenCanvas = offscreenCanvasRef.current
    if (!canvas || !offscreenCanvas) return

    const ctx = canvas.getContext('2d')
    const offscreenCtx = offscreenCanvas.getContext('2d')
    if (!ctx || !offscreenCtx) return

    timeRef.current += waveSpeed * 0.01

    offscreenCtx.setTransform(1, 0, 0, 1, 0, 0)
    offscreenCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height)

    draw(offscreenCtx, offscreenCanvas, timeRef.current, cursorPositionRef.current)

    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(offscreenCanvas, 0, 0)

    animationRef.current = requestAnimationFrame(animate)
  }, [draw, waveSpeed])

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const offscreenCanvas = offscreenCanvasRef.current;
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

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    offscreenCanvas.width = canvasWidth;
    offscreenCanvas.height = canvasHeight;

    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
  }, []);

  const handleCanvasMouseDown = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const canvasX = (event.clientX - rect.left) * (canvas.width / rect.width);
      const canvasY = (event.clientY - rect.top) * (canvas.height / rect.height);
      const { x, y } = canvasToWorld(canvasX, canvasY, canvas);

      if (mode === "edit") {
        if (isOverToolbox(canvasX, canvasY, canvas)) {
          isDraggingRef.current = true;
          draggingPositionRef.current = { x, y };
          dragOffsetRef.current = { x: 0, y: 0 };
          setIsNewAntenna(true);
          setShowTrashCan(true);
        } else {
          for (let i = 0; i < antennas.length; i++) {
            const antenna = antennas[i];
            const distance = Math.sqrt((x - antenna.x) ** 2 + (y - antenna.y) ** 2);
            if (distance < 0.25) {
              draggingAntennaRef.current = antenna;
              isDraggingRef.current = true;
              draggingPositionRef.current = { x: antenna.x, y: antenna.y };
              dragOffsetRef.current = { x: x - antenna.x, y: y - antenna.y };
              setDraggingAntennaIndex(i);
              setShowTrashCan(true);
              return;
            }
          }
        }
      } else if (mode === "target") {
        setTarget({ x, y });
      }
    },
    [mode, antennas, setTarget, canvasToWorld, isOverToolbox]
  );

  const handleCanvasMouseMove = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const canvasX = (event.clientX - rect.left) * (canvas.width / rect.width);
      const canvasY = (event.clientY - rect.top) * (canvas.height / rect.height);
      const { x, y } = canvasToWorld(canvasX, canvasY, canvas);

      cursorPositionRef.current = { x: canvasX, y: canvasY };

      if (isDraggingRef.current && dragOffsetRef.current) {
        draggingPositionRef.current = {
          x: x - dragOffsetRef.current.x,
          y: y - dragOffsetRef.current.y
        };
      }
    },
    [canvasToWorld]
  );

  const handleCanvasMouseUp = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isDraggingRef.current && draggingPositionRef.current) {
      const { x, y } = draggingPositionRef.current;
      if (isOverToolbox(worldToCanvas(x, y, canvas).x, worldToCanvas(x, y, canvas).y, canvas)) {
        if (!isNewAntenna) {
          setAntennas((prevAntennas) => prevAntennas.filter((_, index) => index !== draggingAntennaIndex));
        }
      } else if (isNewAntenna) {
        setAntennas((prevAntennas) => [...prevAntennas, { x, y, phase: 0 }]);
      } else {
        setAntennas((prevAntennas) => prevAntennas.map((antenna, index) =>
          index === draggingAntennaIndex
            ? { ...antenna, x, y }
            : antenna
        ));
      }
    }
    draggingAntennaRef.current = null;
    isDraggingRef.current = false;
    draggingPositionRef.current = null;
    dragOffsetRef.current = null;
    setDraggingAntennaIndex(null);
    setIsNewAntenna(false);
    setShowTrashCan(false);
  }, [draggingAntennaIndex, isNewAntenna, isOverToolbox, setAntennas, worldToCanvas]);


  const nativeHandleCanvasTouchStart: TouchStartHandler = useCallback((event) => {
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const touch = event.touches[0];
    const canvasX = (touch.clientX - rect.left) * (canvas.width / rect.width);
    const canvasY = (touch.clientY - rect.top) * (canvas.height / rect.height);
    const { x, y } = canvasToWorld(canvasX, canvasY, canvas);

      if (mode === "edit") {
        if (isOverToolbox(canvasX, canvasY, canvas)) {
          isDraggingRef.current = true;
          draggingPositionRef.current = { x, y };
          dragOffsetRef.current = { x: 0, y: 0 };
          setIsNewAntenna(true);
          setShowTrashCan(true);
        } else {
          for (let i = 0; i < antennas.length; i++) {
            const antenna = antennas[i];
            const distance = Math.sqrt((x - antenna.x) ** 2 + (y - antenna.y) ** 2);
            if (distance < 0.25) {
              draggingAntennaRef.current = antenna;
              isDraggingRef.current = true;
              draggingPositionRef.current = { x: antenna.x, y: antenna.y };
              dragOffsetRef.current = { x: x - antenna.x, y: y - antenna.y };
              setDraggingAntennaIndex(i);
              setShowTrashCan(true);
              return;
            }
          }
        }
      } else if (mode === "target") {
        setTarget({ x, y });
      }
  }, [mode, antennas, setTarget, canvasToWorld, isOverToolbox]);

  const nativeHandleCanvasTouchMove: TouchMoveHandler = useCallback((event) => {
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const touch = event.touches[0];
    const canvasX = (touch.clientX - rect.left) * (canvas.width / rect.width);
    const canvasY = (touch.clientY - rect.top) * (canvas.height / rect.height);
    const { x, y } = canvasToWorld(canvasX, canvasY, canvas);

    cursorPositionRef.current = { x: canvasX, y: canvasY };

    if (isDraggingRef.current && dragOffsetRef.current) {
      draggingPositionRef.current = {
        x: x - dragOffsetRef.current.x,
        y: y - dragOffsetRef.current.y
      };
    }
  }, [canvasToWorld]);

  const nativeHandleCanvasTouchEnd: TouchEndHandler = useCallback((event) => {
    event.preventDefault();
    handleCanvasMouseUp();
  }, [handleCanvasMouseUp]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      offscreenCanvasRef.current = document.createElement('canvas');
      const ctx = offscreenCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.globalCompositeOperation = 'source-over';
      }
    }

    const canvas = canvasRef.current
    const offscreenCanvas = offscreenCanvasRef.current
    if (!canvas || !offscreenCanvas) return

    const ctx = canvas.getContext('2d')
    const offscreenCtx = offscreenCanvas.getContext('2d')
    if (!ctx || !offscreenCtx) return

    resizeCanvas()

    const resizeObserver = new ResizeObserver(resizeCanvas)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    animationRef.current = requestAnimationFrame(animate)

    // Add touch event listeners
    canvas.addEventListener('touchstart', nativeHandleCanvasTouchStart);
    canvas.addEventListener('touchmove', nativeHandleCanvasTouchMove);
    canvas.addEventListener('touchend', nativeHandleCanvasTouchEnd);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current)
      }
      resizeObserver.disconnect()

      // Remove touch event listeners
      canvas.removeEventListener('touchstart', nativeHandleCanvasTouchStart);
      canvas.removeEventListener('touchmove', nativeHandleCanvasTouchMove);
      canvas.removeEventListener('touchend', nativeHandleCanvasTouchEnd);
    }
  }, [animate, resizeCanvas]);

  return (
    <div ref={containerRef} className="w-full h-full bg-gray-50">
      {useMemo(() => (
        <canvas
          ref={canvasRef}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseEnter={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          className="mx-auto"
        />
      ), [handleCanvasMouseDown, handleCanvasMouseMove, handleCanvasMouseUp])}
    </div>
  )
}

