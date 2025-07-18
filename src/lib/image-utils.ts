// src/lib/image-utils.ts
'use client';

/**
 * Applies a mask to an image to make the background transparent.
 * @param originalImageUri The data URI of the original image.
 * @param maskImageUri The data URI of the mask image (white foreground, black background).
 * @returns A promise that resolves to a data URI of the image with a transparent background.
 */
export function applyMaskToImage(originalImageUri: string, maskImageUri: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const originalImg = new Image();
        const maskImg = new Image();
        let loadedCount = 0;

        const onImagesLoaded = () => {
            if (++loadedCount < 2) return;

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get canvas context'));
            }

            canvas.width = originalImg.naturalWidth;
            canvas.height = originalImg.naturalHeight;

            // Draw the mask first
            ctx.drawImage(maskImg, 0, 0, canvas.width, canvas.height);
            
            // Use 'source-in' to make it so that the next thing drawn
            // will only be drawn where the mask (white pixels) is.
            ctx.globalCompositeOperation = 'source-in';

            // Draw the original image, which will be clipped by the mask
            ctx.drawImage(originalImg, 0, 0, canvas.width, canvas.height);

            resolve(canvas.toDataURL('image/png'));
        };

        originalImg.onload = onImagesLoaded;
        maskImg.onload = onImagesLoaded;

        originalImg.onerror = () => reject(new Error('Failed to load original image.'));
        maskImg.onerror = () => reject(new Error('Failed to load mask image.'));

        // Set crossOrigin to anonymous to avoid tainted canvas issues if images are from a different origin
        originalImg.crossOrigin = "anonymous";
        maskImg.crossOrigin = "anonymous";
        
        originalImg.src = originalImageUri;
        maskImg.src = maskImageUri;
    });
}
