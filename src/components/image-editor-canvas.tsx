// src/components/image-editor-canvas.tsx
"use client"

import React, { useRef, useImperativeHandle, forwardRef, useState, useEffect } from 'react';
import CanvasDraw from 'react-canvas-draw';
import { Card } from './ui/card';

interface ImageEditorCanvasProps {
    imageUrl: string;
    brushRadius?: number;
    brushColor?: string;
}

export interface ImageEditorCanvasRef {
    clear: () => void;
    getMaskAsDataURI: () => Promise<string | null>;
}

export const ImageEditorCanvas = forwardRef<ImageEditorCanvasRef, ImageEditorCanvasProps>(
    ({ imageUrl, brushRadius = 20, brushColor = "rgba(255,255,255,1)" }, ref) => {
        const canvasRef = useRef<CanvasDraw>(null);
        const [imgDimensions, setImgDimensions] = useState({ width: 512, height: 512 });

        useEffect(() => {
            const img = new Image();
            img.src = imageUrl;
            img.onload = () => {
                setImgDimensions({ width: img.width, height: img.height });
            };
        }, [imageUrl]);

        useImperativeHandle(ref, () => ({
            clear: () => {
                canvasRef.current?.clear();
            },
            getMaskAsDataURI: async (): Promise<string | null> => {
                if (!canvasRef.current) return null;

                const drawingData = canvasRef.current.getSaveData();
                const parsedData = JSON.parse(drawingData);
                
                // Check if there are any lines drawn
                if (!parsedData.lines || parsedData.lines.length === 0) {
                    return null;
                }

                // Create a new canvas to draw the mask
                const maskCanvas = document.createElement('canvas');
                maskCanvas.width = imgDimensions.width;
                maskCanvas.height = imgDimensions.height;
                const ctx = maskCanvas.getContext('2d');

                if (!ctx) return null;

                // Fill with black
                ctx.fillStyle = 'black';
                ctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
                
                // Draw the user's strokes in white
                canvasRef.current.drawImmidiate(ctx);

                return maskCanvas.toDataURL('image/png');
            }
        }));

        return (
            <Card className="relative overflow-hidden w-full" style={{ aspectRatio: `${imgDimensions.width} / ${imgDimensions.height}` }}>
                <CanvasDraw
                    ref={canvasRef}
                    imgSrc={imageUrl}
                    brushRadius={brushRadius}
                    brushColor={brushColor}
                    lazyRadius={0}
                    hideGrid
                    canvasWidth={imgDimensions.width}
                    canvasHeight={imgDimensions.height}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%'}}
                />
            </Card>
        );
    }
);

ImageEditorCanvas.displayName = 'ImageEditorCanvas';
