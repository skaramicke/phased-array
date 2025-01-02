import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Antenna } from "../types";
import {
  calculateGainChartData,
  calculatePhases,
} from "../utils/phaseCalculations";

export function usePhaseArray(
  antennas: Antenna[],
  target: { x: number; y: number } | null,
  setAntennas: React.Dispatch<React.SetStateAction<Antenna[]>>
) {
  const [draggingAntennaIndex, setDraggingAntennaIndex] = useState<
    number | null
  >(null);
  const [isNewAntenna, setIsNewAntenna] = useState(false);
  const [showTrashCan, setShowTrashCan] = useState(false);
  const [wasDragging, setWasDragging] = useState(false);

  const draggingAntennaRef = useRef<Antenna | null>(null);
  const isDraggingRef = useRef(false);
  const draggingPositionRef = useRef<{ x: number; y: number } | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number } | null>(null);
  const cursorPositionRef = useRef<{ x: number; y: number } | null>(null);

  const memoizedGainChartData = useMemo(() => {
    if (antennas.length === 0) return null;
    return calculateGainChartData(antennas);
  }, [antennas]);

  useEffect(() => {
    if (target) {
      setAntennas((prevAntennas) => calculatePhases(prevAntennas, target));
    }
  }, [target, setAntennas]);

  const handleStartDragging = useCallback(
    (
      index: number | null,
      position: { x: number; y: number },
      offset: { x: number; y: number }
    ) => {
      isDraggingRef.current = true;
      draggingPositionRef.current = position;
      dragOffsetRef.current = offset;
      setDraggingAntennaIndex(index);
      setShowTrashCan(true);
    },
    []
  );

  const handleStopDragging = useCallback(() => {
    draggingAntennaRef.current = null;
    isDraggingRef.current = false;
    draggingPositionRef.current = null;
    dragOffsetRef.current = null;
    setDraggingAntennaIndex(null);
    setIsNewAntenna(false);
    setShowTrashCan(false);

    if (isDraggingRef.current) {
      setWasDragging(true);
      setTimeout(() => setWasDragging(false), 0);
    }
  }, []);

  return {
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
  };
}
