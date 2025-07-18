// src/ai/flows/generate-image.ts
'use server';
/**
 * @fileOverview A flow to generate images from a text prompt and an optional base image using the Gemini API.
 *
 * - generateImage - A function that generates an image based on a text prompt and optional photo.
 * - GenerateImageInput - The input type for the generateImage function.
 * - GenerateImageOutput - The return type for the generateImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {uploadImage as uploadImageToSupabase} from '@/services/storage';

const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('The text prompt to generate an image from.'),
  photoUrl: z
    .string()
    .optional()
    .describe('An optional public URL of a photo to use as a reference.'),
  userId: z.string().describe('The ID of the user generating the image.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  imageUrl: z.string().describe('The public URL of the generated image.'),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

export async function generateImage(
  input: GenerateImageInput
): Promise<GenerateImageOutput> {
  return generateImageFlow(input);
}

const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async (input) => {
    const promptPayload: (
      | string
      | {media: {url: string; contentType?: string}}
    )[] = [input.prompt];

    if (input.photoUrl) {
      promptPayload.unshift({media: {url: input.photoUrl}});
    }

    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: promptPayload,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media?.url) {
      throw new Error('No image was generated.');
    }

    const publicUrl = await uploadImageToSupabase(media.url, 'generated-files', input.userId);

    return {imageUrl: publicUrl};
  }
);
