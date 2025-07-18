// src/ai/flows/remove-background-flow.ts
'use server';
/**
 * @fileOverview A flow to remove the background from an image.
 *
 * - removeBackground - A function that removes the background.
 * - RemoveBackgroundInput - The input type for the removeBackground function.
 * - RemoveBackgroundOutput - The return type for the removeBackground function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RemoveBackgroundInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "The original image as a data URI, including MIME type and Base64 encoding."
    ),
});
export type RemoveBackgroundInput = z.infer<typeof RemoveBackgroundInputSchema>;

const RemoveBackgroundOutputSchema = z.object({
  maskDataUri: z.string().describe('A data URI of the foreground mask, where the subject is white and the background is black.'),
});
export type RemoveBackgroundOutput = z.infer<typeof RemoveBackgroundOutputSchema>;

export async function removeBackground(input: RemoveBackgroundInput): Promise<RemoveBackgroundOutput> {
  return removeBackgroundFlow(input);
}

const removeBackgroundFlow = ai.defineFlow(
  {
    name: 'removeBackgroundFlow',
    inputSchema: RemoveBackgroundInputSchema,
    outputSchema: RemoveBackgroundOutputSchema,
  },
  async (input) => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: [
        {text: "Create a segmentation mask of the primary subject in this image. The subject should be solid white and the background solid black. Do not include any other text or elements, only the mask itself."},
        {media: {url: input.photoDataUri}},
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media?.url) {
      throw new Error('No mask was generated for background removal.');
    }

    return {maskDataUri: media.url};
  }
);
