import { useRef, useEffect, useCallback, useMemo, useState } from "react";
import { Antenna } from "../types";
import { drawGrid } from "../drawing/grid";
import { drawPropagation, drawEmissionCircles } from "../drawing/propagation";
import {
  drawAntennas,
  drawTarget,
  drawDraggingAntenna,
} from "../drawing/antennas";
import { drawToolbox, drawAntennaIcon } from "../drawing/toolbox";
import { drawHelpMessage } from "../drawing/help";
import { drawGainChart } from "../drawing/gain-chart";
import { usePhaseArray } from "../hooks/usePhaseArray";
import {
  canvasToWorld,
  worldToCanvas,
  isOverToolbox,
} from "../utils/canvasUtils";

type TouchStartHandler = (event: TouchEvent) => void;
type TouchMoveHandler = (event: TouchEvent) => void;
type TouchEndHandler = (event: TouchEvent) => void;

interface PhaseArrayCanvasProps {
  antennas: Antenna[];
  setAntennas: React.Dispatch<React.SetStateAction<Antenna[]>>;
  target: { x: number; y: number } | null;
  setTarget: (target: { x: number; y: number } | null) => void;
  showWaves: boolean;
  showEmissionCircles: boolean;
  waveSpeed: number;
  gainChartMode: "none" | "widget" | "overlay";
  selectedAntennaIndex: number | null;
}

export function PhaseArrayCanvas({
  antennas,
  setAntennas,
  target,
  setTarget,
  showWaves,
  showEmissionCircles,
  waveSpeed,
  gainChartMode,
  selectedAntennaIndex,
}: PhaseArrayCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isToolboxHovered, setIsToolboxHovered] = useState(false);

  // Add these refs to track panning state without rerenders
  const isPanningRef = useRef(false);
  const panStartRef = useRef<{ x: number; y: number } | null>(null);
  const panOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const {
    draggingAntennaIndex,
    isNewAntenna,
    setIsNewAntenna,
    showTrashCan,
    wasDragging,
    setWasDragging,
    draggingAntennaRef,
    isDraggingRef,
    draggingPositionRef,
    dragOffsetRef,
    cursorPositionRef,
    memoizedGainChartData,
    handleStartDragging,
    handleStopDragging,
  } = usePhaseArray(antennas, target, setAntennas);

  const drawOverlay = useCallback(
    (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    },
    []
  );

  // Modified draw function to handle all states consistently
  const draw = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      canvas: HTMLCanvasElement,
      time: number,
      cursorPosition: { x: number; y: number } | null
    ) => {
      const gridSize = 10;
      const wavelengthPixels = canvas.width / gridSize;

      // Clear the entire canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw the base grid
      drawGrid(ctx, canvas, gridSize);

      // Draw origin marker
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 5, 0, 2 * Math.PI);
      ctx.fill();

      if (antennas.length > 0) {
        const transformedAntennas = antennas.map((antenna) => ({
          ...antenna,
          x: antenna.x + (isPanningRef.current ? panOffsetRef.current.x : 0),
          y: antenna.y - (isPanningRef.current ? panOffsetRef.current.y : 0),
        }));

        // Draw propagation waves (only when not panning)
        if (showWaves) {
          drawPropagation(
            ctx,
            canvas,
            transformedAntennas,
            wavelengthPixels,
            time,
            waveSpeed
          );
        }

        // Draw emission circles (only when not panning)
        if (showEmissionCircles) {
          drawEmissionCircles(
            ctx,
            canvas,
            transformedAntennas,
            wavelengthPixels,
            time,
            waveSpeed
          );
        }

        // Draw gain chart if needed (only when not panning)
        if (transformedAntennas.length > 0 && memoizedGainChartData) {
          if (gainChartMode === "widget") {
            drawGainChart(ctx, canvas, memoizedGainChartData, "widget");
          } else if (gainChartMode === "overlay") {
            drawGainChart(
              ctx,
              canvas,
              memoizedGainChartData,
              "overlay",
              transformedAntennas
            );
          }
        }

        // Draw antennas with new positions
        drawAntennas(
          ctx,
          transformedAntennas,
          wavelengthPixels,
          isDraggingRef.current,
          draggingAntennaIndex,
          selectedAntennaIndex
        );
      }

      // Draw target if it exists
      if (target) {
        const transformedTarget = {
          x: target.x + (isPanningRef.current ? panOffsetRef.current.x : 0),
          y: target.y - (isPanningRef.current ? panOffsetRef.current.y : 0),
        };
        drawTarget(ctx, transformedTarget, wavelengthPixels);
      }

      // Draw dragging antenna if needed
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
        } else {
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

      // Draw help overlay if needed
      if (antennas.length === 0 && !isDraggingRef.current) {
        drawOverlay(ctx, canvas);
        drawHelpMessage(ctx, canvas);
      }

      // Always draw toolbox last
      drawToolbox(
        ctx,
        canvas,
        wavelengthPixels,
        showTrashCan,
        isToolboxHovered
      );

      // Draw antenna icon when dragging over toolbox
      if (
        isDraggingRef.current &&
        draggingPositionRef.current &&
        dragOffsetRef.current &&
        cursorPosition &&
        isOverToolbox(cursorPosition.x, cursorPosition.y, canvas)
      ) {
        const iconSize = wavelengthPixels * 0.75;
        drawAntennaIcon(
          ctx,
          cursorPosition.x - iconSize / 2,
          cursorPosition.y - iconSize / 2,
          iconSize
        );
      }
    },
    [
      antennas,
      target,
      isDraggingRef,
      draggingPositionRef,
      dragOffsetRef,
      showTrashCan,
      showWaves,
      showEmissionCircles,
      draggingAntennaIndex,
      gainChartMode,
      memoizedGainChartData,
      waveSpeed,
      drawOverlay,
      isToolboxHovered,
      selectedAntennaIndex,
    ]
  );

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    const offscreenCanvas = offscreenCanvasRef.current;
    if (!canvas || !offscreenCanvas) return;

    const ctx = canvas.getContext("2d");
    const offscreenCtx = offscreenCanvas.getContext("2d");
    if (!ctx || !offscreenCtx) return;

    timeRef.current += waveSpeed * 0.01;

    offscreenCtx.setTransform(1, 0, 0, 1, 0, 0);
    offscreenCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

    draw(
      offscreenCtx,
      offscreenCanvas,
      timeRef.current,
      cursorPositionRef.current
    );

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(offscreenCanvas, 0, 0);

    animationRef.current = requestAnimationFrame(animate);
  }, [draw, waveSpeed, cursorPositionRef]);

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

  const handlePan = useCallback(
    (
      event:
        | React.MouseEvent<HTMLCanvasElement>
        | React.TouchEvent<HTMLCanvasElement>
        | globalThis.TouchEvent
    ) => {
      if (!isPanningRef.current || !panStartRef.current) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const clientX =
        "touches" in event ? event.touches[0].clientX : event.clientX;
      const clientY =
        "touches" in event ? event.touches[0].clientY : event.clientY;
      const canvasX = (clientX - rect.left) * (canvas.width / rect.width);
      const canvasY = (clientY - rect.top) * (canvas.height / rect.height);

      const dx = (canvasX - panStartRef.current.x) / (canvas.width / 10);
      const dy = (canvasY - panStartRef.current.y) / (canvas.height / 10);

      panOffsetRef.current = { x: dx, y: dy };
    },
    [] // Empty dependency array since we're using refs
  );

  const handleCanvasMouseDown = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const canvasX = (event.clientX - rect.left) * (canvas.width / rect.width);
      const canvasY =
        (event.clientY - rect.top) * (canvas.height / rect.height);
      const { x, y } = canvasToWorld(canvasX, canvasY, canvas);

      if (isOverToolbox(canvasX, canvasY, canvas)) {
        handleStartDragging(null, { x, y }, { x: 0, y: 0 });
        setIsNewAntenna(true);
      } else {
        let antennaFound = false;
        for (let i = 0; i < antennas.length; i++) {
          const antenna = antennas[i];
          const distance = Math.sqrt(
            (x - antenna.x) ** 2 + (y - antenna.y) ** 2
          );
          if (distance < 0.25) {
            draggingAntennaRef.current = antenna;
            handleStartDragging(
              i,
              { x: antenna.x, y: antenna.y },
              { x: x - antenna.x, y: y - antenna.y }
            );
            antennaFound = true;
            break;
          }
        }
        if (!antennaFound) {
          isPanningRef.current = true;
          panStartRef.current = { x: canvasX, y: canvasY };
          panOffsetRef.current = { x: 0, y: 0 };
        }
      }
    },
    [antennas, draggingAntennaRef, handleStartDragging, setIsNewAntenna]
  );

  const handleCanvasMouseMove = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const canvasX = (event.clientX - rect.left) * (canvas.width / rect.width);
      const canvasY =
        (event.clientY - rect.top) * (canvas.height / rect.height);
      const { x, y } = canvasToWorld(canvasX, canvasY, canvas);

      cursorPositionRef.current = { x: canvasX, y: canvasY };

      setIsToolboxHovered(isOverToolbox(canvasX, canvasY, canvas));

      if (isDraggingRef.current && dragOffsetRef.current) {
        draggingPositionRef.current = {
          x: x - dragOffsetRef.current.x,
          y: y - dragOffsetRef.current.y,
        };
      } else if (isPanningRef.current) {
        handlePan(event);
      }
    },
    [
      cursorPositionRef,
      dragOffsetRef,
      draggingPositionRef,
      isDraggingRef,
      setIsToolboxHovered,
      isPanningRef,
      handlePan,
    ]
  );

  const handleCanvasMouseUp = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (isDraggingRef.current && draggingPositionRef.current) {
        const { x, y } = draggingPositionRef.current;
        if (
          isOverToolbox(
            worldToCanvas(x, y, canvas).x,
            worldToCanvas(x, y, canvas).y,
            canvas
          )
        ) {
          if (!isNewAntenna) {
            setAntennas((prevAntennas) =>
              prevAntennas.filter((_, index) => index !== draggingAntennaIndex)
            );
          }
        } else if (isNewAntenna) {
          setAntennas((prevAntennas) => [...prevAntennas, { x, y, phase: 0 }]);
        } else {
          setAntennas((prevAntennas) =>
            prevAntennas.map((antenna, index) =>
              index === draggingAntennaIndex ? { ...antenna, x, y } : antenna
            )
          );
        }
        setWasDragging(true);
        setTimeout(() => setWasDragging(false), 0);
      }

      if (isPanningRef.current) {
        setAntennas((prevAntennas) =>
          prevAntennas.map((antenna) => ({
            ...antenna,
            x: antenna.x + panOffsetRef.current.x,
            y: antenna.y - panOffsetRef.current.y,
          }))
        );
        if (target) {
          setTarget({
            x: target.x + panOffsetRef.current.x,
            y: target.y - panOffsetRef.current.y,
          });
        }
      }
      handleStopDragging();
      isPanningRef.current = false;
      panStartRef.current = null;
      panOffsetRef.current = { x: 0, y: 0 };

      // If we were dragging or panning, prevent the click event from firing
      if (isDraggingRef.current || isPanningRef.current) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    [
      isDraggingRef,
      draggingPositionRef,
      handleStopDragging,
      isNewAntenna,
      setWasDragging,
      setAntennas,
      draggingAntennaIndex,
      target,
      setTarget,
    ]
  );

  const handleCanvasClick = useCallback(
    (
      event:
        | React.MouseEvent<HTMLCanvasElement>
        | React.TouchEvent<HTMLCanvasElement>
    ) => {
      if (wasDragging) return; // Ignore clicks right after dragging

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      let clientX: number, clientY: number;

      if ("touches" in event) {
        // Touch event
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
      } else {
        // Mouse event
        clientX = event.clientX;
        clientY = event.clientY;
      }

      const canvasX = (clientX - rect.left) * (canvas.width / rect.width);
      const canvasY = (clientY - rect.top) * (canvas.height / rect.height);
      const { x, y } = canvasToWorld(canvasX, canvasY, canvas);

      // Check if the click/touch is on the toolbox
      if (isOverToolbox(canvasX, canvasY, canvas)) {
        return; // Don't set target if click is on toolbox
      }

      // Check if the click/touch is on an antenna
      const isOnAntenna = antennas.some(
        (antenna) =>
          Math.sqrt((x - antenna.x) ** 2 + (y - antenna.y) ** 2) < 0.25
      );

      if (antennas.length > 0 && !isOnAntenna) {
        setTarget({ x, y });
      }
    },
    [antennas, wasDragging, setTarget]
  );

  const nativeHandleCanvasTouchStart: TouchStartHandler = useCallback(
    (event) => {
      event.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const touch = event.touches[0];
      const canvasX = (touch.clientX - rect.left) * (canvas.width / rect.width);
      const canvasY =
        (touch.clientY - rect.top) * (canvas.height / rect.height);
      const { x, y } = canvasToWorld(canvasX, canvasY, canvas);

      if (isOverToolbox(canvasX, canvasY, canvas)) {
        handleStartDragging(null, { x, y }, { x: 0, y: 0 });
        setIsNewAntenna(true);
      } else {
        let antennaFound = false;
        for (let i = 0; i < antennas.length; i++) {
          const antenna = antennas[i];
          const distance = Math.sqrt(
            (x - antenna.x) ** 2 + (y - antenna.y) ** 2
          );
          if (distance < 0.25) {
            draggingAntennaRef.current = antenna;
            handleStartDragging(
              i,
              { x: antenna.x, y: antenna.y },
              { x: x - antenna.x, y: y - antenna.y }
            );
            antennaFound = true;
            break;
          }
        }
        if (!antennaFound) {
          isPanningRef.current = true;
          panStartRef.current = { x: canvasX, y: canvasY };
          panOffsetRef.current = { x: 0, y: 0 };
        }
      }
    },
    [antennas, handleStartDragging, setIsNewAntenna, draggingAntennaRef]
  );

  const nativeHandleCanvasTouchMove: TouchMoveHandler = useCallback(
    (event) => {
      event.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const touch = event.touches[0];
      const canvasX = (touch.clientX - rect.left) * (canvas.width / rect.width);
      const canvasY =
        (touch.clientY - rect.top) * (canvas.height / rect.height);
      const { x, y } = canvasToWorld(canvasX, canvasY, canvas);

      cursorPositionRef.current = { x: canvasX, y: canvasY };

      setIsToolboxHovered(isOverToolbox(canvasX, canvasY, canvas));

      if (isDraggingRef.current && dragOffsetRef.current) {
        draggingPositionRef.current = {
          x: x - dragOffsetRef.current.x,
          y: y - dragOffsetRef.current.y,
        };
      } else if (isPanningRef.current) {
        handlePan(event);
      }
    },
    [
      cursorPositionRef,
      dragOffsetRef,
      draggingPositionRef,
      isDraggingRef,
      setIsToolboxHovered,
      isPanningRef,
      handlePan,
    ]
  );

  const nativeHandleCanvasTouchEnd: TouchEndHandler = useCallback(
    (event) => {
      event.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (isDraggingRef.current && draggingPositionRef.current) {
        const { x, y } = draggingPositionRef.current;
        if (
          isOverToolbox(
            worldToCanvas(x, y, canvas).x,
            worldToCanvas(x, y, canvas).y,
            canvas
          )
        ) {
          if (!isNewAntenna) {
            setAntennas((prevAntennas) =>
              prevAntennas.filter((_, index) => index !== draggingAntennaIndex)
            );
          }
        } else if (isNewAntenna) {
          setAntennas((prevAntennas) => [...prevAntennas, { x, y, phase: 0 }]);
        } else {
          setAntennas((prevAntennas) =>
            prevAntennas.map((antenna, index) =>
              index === draggingAntennaIndex ? { ...antenna, x, y } : antenna
            )
          );
        }
        setWasDragging(true);
        setTimeout(() => setWasDragging(false), 0);
      } else if (!wasDragging && !isPanningRef.current && antennas.length > 0) {
        const touch = event.changedTouches[0];
        const rect = canvas.getBoundingClientRect();
        const canvasX =
          (touch.clientX - rect.left) * (canvas.width / rect.width);
        const canvasY =
          (touch.clientY - rect.top) * (canvas.height / rect.height);
        const { x, y } = canvasToWorld(canvasX, canvasY, canvas);
        setTarget({ x, y });
      }

      if (isPanningRef.current) {
        setAntennas((prevAntennas) =>
          prevAntennas.map((antenna) => ({
            ...antenna,
            x: antenna.x + panOffsetRef.current.x,
            y: antenna.y - panOffsetRef.current.y,
          }))
        );
        if (target) {
          setTarget({
            x: target.x + panOffsetRef.current.x,
            y: target.y - panOffsetRef.current.y,
          });
        }
      }
      handleStopDragging();
      isPanningRef.current = false;
      panStartRef.current = null;
      panOffsetRef.current = { x: 0, y: 0 };
    },
    [
      isDraggingRef,
      draggingPositionRef,
      handleStopDragging,
      isNewAntenna,
      setWasDragging,
      setAntennas,
      draggingAntennaIndex,
      antennas.length,
      setTarget,
      wasDragging,
      target,
    ]
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      offscreenCanvasRef.current = document.createElement("canvas");
      const ctx = offscreenCanvasRef.current.getContext("2d");
      if (ctx) {
        ctx.globalCompositeOperation = "source-over";
      }
    }

    const canvas = canvasRef.current;
    const offscreenCanvas = offscreenCanvasRef.current;
    if (!canvas || !offscreenCanvas) return;

    const ctx = canvas.getContext("2d");
    const offscreenCtx = offscreenCanvas.getContext("2d");
    if (!ctx || !offscreenCtx) return;

    resizeCanvas();

    const resizeObserver = new ResizeObserver(resizeCanvas);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    animationRef.current = requestAnimationFrame(animate);

    // Add touch event listeners
    canvas.addEventListener("touchstart", nativeHandleCanvasTouchStart);
    canvas.addEventListener("touchmove", nativeHandleCanvasTouchMove);
    canvas.addEventListener("touchend", nativeHandleCanvasTouchEnd);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
      resizeObserver.disconnect();

      // Remove touch event listeners
      canvas.removeEventListener("touchstart", nativeHandleCanvasTouchStart);
      canvas.removeEventListener("touchmove", nativeHandleCanvasTouchMove);
      canvas.removeEventListener("touchend", nativeHandleCanvasTouchEnd);
    };
  }, [
    animate,
    resizeCanvas,
    nativeHandleCanvasTouchStart,
    nativeHandleCanvasTouchMove,
    nativeHandleCanvasTouchEnd,
    antennas.length,
    setTarget,
    wasDragging,
  ]);

  return (
    <div ref={containerRef} className="w-full h-full bg-gray-50 relative">
      {useMemo(
        () => (
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            onTouchStart={handleCanvasClick}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            className="mx-auto"
          />
        ),
        [
          handleCanvasClick,
          handleCanvasMouseDown,
          handleCanvasMouseMove,
          handleCanvasMouseUp,
        ]
      )}
    </div>
  );
}
