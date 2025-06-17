'use server';
/**
 * @fileOverview A Genkit flow for uploading a banner image to Firebase Storage.
 *
 * - uploadBanner - A function that handles the banner image upload process.
 * - UploadBannerInput - The input type for the uploadBanner function.
 * - UploadBannerOutput - The return type for the uploadBanner function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { adminStorage } from '@/lib/firebase-admin';

const UploadBannerInputSchema = z.object({
  fileDataUri: z
    .string()
    .describe(
      "The banner image as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type UploadBannerInput = z.infer<typeof UploadBannerInputSchema>;

const UploadBannerOutputSchema = z.object({
  uploadedFileUrl: z.string().url().describe('The public URL of the uploaded banner image.'),
});
export type UploadBannerOutput = z.infer<typeof UploadBannerOutputSchema>;

export async function uploadBanner(input: UploadBannerInput): Promise<UploadBannerOutput> {
  return uploadBannerFlow(input);
}

const uploadBannerFlow = ai.defineFlow(
  {
    name: 'uploadBannerFlow',
    inputSchema: UploadBannerInputSchema,
    outputSchema: UploadBannerOutputSchema,
  },
  async (input) => {
    try {
      const { fileDataUri } = input;

      // Extract MIME type, extension and Base64 data from Data URI
      const matches = fileDataUri.match(/^data:(image\/(.+));base64,(.+)$/);
      if (!matches || matches.length !== 4) {
        // Fallback for non-image mimetypes or different structures if needed in future
        const genericMatches = fileDataUri.match(/^data:(.+);base64,(.+)$/);
        if (!genericMatches || genericMatches.length !== 3) {
          throw new Error('Invalid data URI format.');
        }
        const mimeType = genericMatches[1];
        const base64Data = genericMatches[2];
        const buffer = Buffer.from(base64Data, 'base64');
        const extension = mimeType.split('/')[1] || 'bin'; // default extension
        
        const dynamicBannerPath = `site-configuration/banner-image.${extension}`;
        const bucket = adminStorage.bucket();
        const file = bucket.file(dynamicBannerPath);

        await file.save(buffer, {
          metadata: {
            contentType: mimeType,
            cacheControl: 'public, max-age=3600',
          },
        });
        await file.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${dynamicBannerPath}`;
        return { uploadedFileUrl: publicUrl };
      }
      
      const mimeType = matches[1];
      const extension = matches[2]; // e.g., png, jpeg
      const base64Data = matches[3];
      const buffer = Buffer.from(base64Data, 'base64');

      const dynamicBannerPath = `site-configuration/banner-image.${extension}`;

      const bucket = adminStorage.bucket();
      const file = bucket.file(dynamicBannerPath);

      await file.save(buffer, {
        metadata: {
          contentType: mimeType,
          cacheControl: 'public, max-age=3600', // Cache for 1 hour
        },
      });

      await file.makePublic();
      
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${dynamicBannerPath}`;

      return { uploadedFileUrl: publicUrl };

    } catch (error) {
      console.error('Error in uploadBannerFlow:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to upload banner: ${error.message}`);
      }
      throw new Error('An unknown error occurred during banner upload.');
    }
  }
);
