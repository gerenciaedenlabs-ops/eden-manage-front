/* eslint-disable react/prop-types */
import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@components/ui/button.tsx";
import { Label } from "@components/ui/label.tsx";
import { Eraser } from "lucide-react";

export function SignatureCanvas({ value, onChange }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const getCtx = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext("2d");
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size (handling retina displays etc)
    const rect = canvas.getBoundingClientRect();
    // Only set width/height if they differ to avoid clearing on re-render if unnecessary?
    // Actually, setting width/height always clears canvas.
    // We should only do this on mount or resize.
    if (canvas.width !== rect.width * 2) {
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      ctx.scale(2, 2);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#000000";
    }

    // Draw value if exists and we haven't drawn new stuff yet
    // Note: If we just drew, hasDrawn is true.
    // If value changes externally (edit mode), we should redraw.
    if (value) {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        // Clear before drawing to avoid overlap/duplication
        ctx.clearRect(0, 0, rect.width, rect.height);
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHasDrawn(true);
        // Revoke URL if it was a blob url we created? checking strictly
        if (typeof value !== "string") {
          URL.revokeObjectURL(img.src);
        }
      };
      // Handle Blob or String
      if (typeof value === "string") {
        img.src = value;
      } else if (value instanceof Blob) {
        img.src = URL.createObjectURL(value);
      }
    }
  }, [value]);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();

    if (e.touches) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const ctx = getCtx();
    if (!ctx) return;

    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing) return;

    const ctx = getCtx();
    if (!ctx) return;

    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;

    setIsDrawing(false);
    setHasDrawn(true);

    const canvas = canvasRef.current;
    if (canvas) {
      // Export as Blob
      canvas.toBlob((blob) => {
        if (blob) {
          onChange(blob);
        }
      }, "image/png");
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);

    setHasDrawn(false);
    onChange(undefined);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Firma (opcional)</Label>
        {hasDrawn && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearCanvas}
            className="gap-1 text-xs"
          >
            <Eraser className="w-3 h-3" />
            Clear
          </Button>
        )}
      </div>

      <canvas
        ref={canvasRef}
        className="w-full h-28 border rounded-md bg-[#FEFEFE] cursor-crosshair touch-none"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />

      <p className="text-xs text-[#555555]">Dibuja tu firma arriba</p>
    </div>
  );
}
