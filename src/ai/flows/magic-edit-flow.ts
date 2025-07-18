// src/ai/flows/magic-edit-flow.ts
'use server';
/**
 * @fileOverview A flow to perform inpainting on an image using a mask and a text prompt.
 *
 * - magicEdit - A function that performs the magic edit.
 * - MagicEditInput - The input type for the magicEdit function.
 * - MagicEditOutput - The return type for the magicEdit function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {uploadImage as uploadImageToSupabase} from '@/services/storage';

const MagicEditInputSchema = z.object({
  prompt: z.string().describe('The text prompt to guide the edit.'),
  photoDataUri: z
    .string()
    .describe(
      "The original image as a data URI, including MIME type and Base64 encoding."
    ),
  maskDataUri: z
    .string()
    .describe(
      "The mask image as a data URI, where the masked area is white and the rest is black."
    ),
  userId: z.string().describe('The ID of the user performing the edit.'),
  userEmail: z.string().describe('The email of the user performing the edit.'),
});
export type MagicEditInput = z.infer<typeof MagicEditInputSchema>;

const MagicEditOutputSchema = z.object({
  imageUrl: z.string().describe('The public URL of the edited image.'),
});
export type MagicEditOutput = z.infer<typeof MagicEditOutputSchema>;

export async function magicEdit(input: MagicEditInput): Promise<MagicEditOutput> {
  return magicEditFlow(input);
}

const magicEditFlow = ai.defineFlow(
  {
    name: 'magicEditFlow',
    inputSchema: MagicEditInputSchema,
    outputSchema: MagicEditOutputSchema,
  },
  async (input) => {
    
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: [
        {text: input.prompt},
        {media: {url: input.photoDataUri}},
        {media: {url: input.maskDataUri}},
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media?.url) {
      throw new Error('No image was generated from the magic edit.');
    }

    const publicUrl = await uploadImageToSupabase(media.url, 'generated-files', input.userEmail);

    return {imageUrl: publicUrl};
  }
);
