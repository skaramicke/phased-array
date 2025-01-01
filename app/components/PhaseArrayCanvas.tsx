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
      const cellSize = canvas.width / gridSize;

      // Always draw the grid
      drawGrid(ctx, canvas, gridSize);

      // Draw other elements if there are antennas, regardless of target
      if (antennas.length > 0) {
        if (showWaves) {
          drawPropagation(
            ctx,
            canvas,
            antennas,
            target,
            cellSize,
            time,
            waveSpeed
          );
        }

        if (showEmissionCircles) {
          drawEmissionCircles(
            ctx,
            canvas,
            antennas,
            target,
            cellSize,
            time,
            waveSpeed
          );
        }

        drawAntennas(ctx, antennas, target, cellSize, cellSize);
      }

      // Always draw the target if it exists
      drawTarget(ctx, target);
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
      timeRef.current += waveSpeed * 0.1;
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to match its display size
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

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
    };
  }, [antennas, target, showWaves, showEmissionCircles, waveSpeed, animate]);

  const handleCanvasMouseDown = (
    event: React.MouseEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (mode === "edit") {
      for (const antenna of antennas) {
        const distance = Math.sqrt((x - antenna.x) ** 2 + (y - antenna.y) ** 2);
        if (distance < canvas.width / (4 * 10)) {
          draggingAntennaRef.current = antenna;
          return;
        }
      }

      setAntennas([...antennas, { x, y }]);
    } else if (mode === "target") {
      setTarget({ x, y });
    }
  };

  const handleCanvasMouseMove = (
    event: React.MouseEvent<HTMLCanvasElement>
  ) => {
    if (!draggingAntennaRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    draggingAntennaRef.current.x = x;
    draggingAntennaRef.current.y = y;

    setAntennas([...antennas]);
  };

  const handleCanvasMouseUp = () => {
    draggingAntennaRef.current = null;
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      className="border border-gray-300 rounded-lg shadow-lg w-full h-full"
    />
  );
}
