
'use server';
/**
 * @fileOverview A Genkit flow for uploading a homepage advertisement image to Firebase Storage.
 *
 * - uploadHomePageAdImage - A function that handles the image upload process.
 * - UploadAdImageInput - The input type for the function.
 * - UploadAdImageOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { adminStorage } from '@/lib/firebase-admin';

const UploadAdImageInputSchema = z.object({
  fileDataUri: z
    .string()
    .describe(
      "The ad image as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type UploadAdImageInput = z.infer<typeof UploadAdImageInputSchema>;

const UploadAdImageOutputSchema = z.object({
  uploadedFileUrl: z.string().url().describe('The public URL of the uploaded ad image.'),
});
export type UploadAdImageOutput = z.infer<typeof UploadAdImageOutputSchema>;

export async function uploadHomePageAdImage(input: UploadAdImageInput): Promise<UploadAdImageOutput> {
  return uploadHomePageAdImageFlow(input);
}

const uploadHomePageAdImageFlow = ai.defineFlow(
  {
    name: 'uploadHomePageAdImageFlow',
    inputSchema: UploadAdImageInputSchema,
    outputSchema: UploadAdImageOutputSchema,
  },
  async (input) => {
    try {
      const { fileDataUri } = input;

      const matches = fileDataUri.match(/^data:(image\/(.+?));base64,(.+)$/);
      let mimeType, extension, base64Data;

      if (matches && matches.length === 4) {
        mimeType = matches[1]; // e.g., image/png
        extension = matches[2]; // e.g., png, jpeg, gif
        if (extension === 'svg+xml') extension = 'svg'; // Handle svg explicitly
        base64Data = matches[3];
      } else {
        // Fallback for other image types or different structures
        const genericMatches = fileDataUri.match(/^data:(.+?);base64,(.+)$/);
        if (!genericMatches || genericMatches.length !== 3) {
          throw new Error('Invalid data URI format.');
        }
        mimeType = genericMatches[1];
        base64Data = genericMatches[2];
        const extParts = mimeType.split('/');
        extension = extParts[1] || 'bin';
        if (extension === 'svg+xml') extension = 'svg';
      }
      
      const buffer = Buffer.from(base64Data, 'base64');
      const dynamicPath = `site-configuration/ads/homepage-ad.${extension}`;

      const bucket = adminStorage.bucket();
      const file = bucket.file(dynamicPath);

      await file.save(buffer, {
        metadata: {
          contentType: mimeType,
          cacheControl: 'public, max-age=3600', // Cache for 1 hour
        },
      });

      await file.makePublic();
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${dynamicPath}`;
      return { uploadedFileUrl: publicUrl };

    } catch (error) {
      console.error('Error in uploadHomePageAdImageFlow:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to upload homepage ad image: ${error.message}`);
      }
      throw new Error('An unknown error occurred during homepage ad image upload.');
    }
  }
);
    