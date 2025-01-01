"use client";

import { useRef, useEffect, useCallback } from "react";
import { Antenna } from "../types";
import {
  drawGrid,
  drawPropagation,
  drawEmissionCircles,
  drawAntennas,
  drawTarget,
} from "../utils/drawing";
import { calculatePhases } from "../utils/phaseCalculations";

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

  const draw = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      canvas: HTMLCanvasElement,
      time: number,
      antennas: Antenna[],
      target: { x: number; y: number } | null,
      showWaves: boolean,
      showEmissionCircles: boolean,
      waveSpeed: number
    ) => {
      const gridSize = 10;
      const wavelengthPixels = canvas.width / gridSize;

      drawGrid(ctx, canvas, gridSize);

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

        drawAntennas(ctx, antennas, wavelengthPixels);
      }

      drawTarget(ctx, target, wavelengthPixels);
    },
    []
  );

  const animate = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      canvas: HTMLCanvasElement,
      antennas: Antenna[],
      target: { x: number; y: number } | null,
      showWaves: boolean,
      showEmissionCircles: boolean,
      waveSpeed: number
    ) => {
      timeRef.current += waveSpeed * 0.01;
      draw(
        ctx,
        canvas,
        timeRef.current,
        antennas,
        target,
        showWaves,
        showEmissionCircles,
        waveSpeed
      );
      animationRef.current = requestAnimationFrame(() =>
        animate(
          ctx,
          canvas,
          antennas,
          target,
          showWaves,
          showEmissionCircles,
          waveSpeed
        )
      );
    },
    [draw]
  );

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

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
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    resizeCanvas();

    const resizeObserver = new ResizeObserver(resizeCanvas);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    animate(
      ctx,
      canvas,
      antennas,
      target,
      showWaves,
      showEmissionCircles,
      waveSpeed
    );

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [
    antennas,
    target,
    showWaves,
    showEmissionCircles,
    waveSpeed,
    animate,
    resizeCanvas,
  ]);

  const handleCanvasMouseDown = (
    event: React.MouseEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x =
      ((event.clientX - rect.left) * (canvas.width / rect.width)) /
      (canvas.width / 10);
    const y =
      ((event.clientY - rect.top) * (canvas.height / rect.height)) /
      (canvas.width / 10);

    if (mode === "edit") {
      for (const antenna of antennas) {
        const distance = Math.sqrt((x - antenna.x) ** 2 + (y - antenna.y) ** 2);
        if (distance < 0.25) {
          draggingAntennaRef.current = antenna;
          return;
        }
      }

      setAntennas([...antennas, { x, y, phase: 0 }]);
    } else if (mode === "target") {
      setTarget({ x, y });
      const updatedAntennas = calculatePhases(antennas, { x, y });
      setAntennas(updatedAntennas);
    }
  };

  const handleCanvasMouseMove = (
    event: React.MouseEvent<HTMLCanvasElement>
  ) => {
    if (!draggingAntennaRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x =
      ((event.clientX - rect.left) * (canvas.width / rect.width)) /
      (canvas.width / 10);
    const y =
      ((event.clientY - rect.top) * (canvas.height / rect.height)) /
      (canvas.width / 10);

    draggingAntennaRef.current.x = x;
    draggingAntennaRef.current.y = y;

    setAntennas([...antennas]);
  };

  const handleCanvasMouseUp = () => {
    draggingAntennaRef.current = null;
  };

  return (
    <div ref={containerRef} className="w-full h-full bg-gray-50">
      <canvas
        ref={canvasRef}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        className="mx-auto"
      />
    </div>
  );
}
