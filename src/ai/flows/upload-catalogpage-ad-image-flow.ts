
'use server';
/**
 * @fileOverview A Genkit flow for uploading a catalog page advertisement image to Firebase Storage.
 *
 * - uploadCatalogPageAdImage - A function that handles the image upload process.
 * - UploadAdImageInput - The input type for the function. (Reused from homepage ad)
 * - UploadAdImageOutput - The return type for the function. (Reused from homepage ad)
 */

import {ai} from '@/ai/genkit';
// Types can be imported from the homepage ad flow if they are identical
import type { UploadAdImageInput, UploadAdImageOutput } from './upload-homepage-ad-image-flow'; 
import {z} from 'genkit'; // Keep z for schema definition if needed locally, though types are imported
import { adminStorage } from '@/lib/firebase-admin';

// Define schemas locally if not importing them directly, or ensure imported types are sufficient
const UploadAdImageInputSchema = z.object({
  fileDataUri: z
    .string()
    .describe(
      "The ad image as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});

const UploadAdImageOutputSchema = z.object({
  uploadedFileUrl: z.string().url().describe('The public URL of the uploaded ad image.'),
});


export async function uploadCatalogPageAdImage(input: UploadAdImageInput): Promise<UploadAdImageOutput> {
  return uploadCatalogPageAdImageFlow(input);
}

const uploadCatalogPageAdImageFlow = ai.defineFlow(
  {
    name: 'uploadCatalogPageAdImageFlow',
    inputSchema: UploadAdImageInputSchema, // Use locally defined or imported schema
    outputSchema: UploadAdImageOutputSchema, // Use locally defined or imported schema
  },
  async (input) => {
    try {
      const { fileDataUri } = input;

      const matches = fileDataUri.match(/^data:(image\/(.+?));base64,(.+)$/);
      let mimeType, extension, base64Data;

      if (matches && matches.length === 4) {
        mimeType = matches[1]; 
        extension = matches[2]; 
        if (extension === 'svg+xml') extension = 'svg';
        base64Data = matches[3];
      } else {
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
      const dynamicPath = `site-configuration/ads/catalogpage-ad.${extension}`;

      const bucket = adminStorage.bucket();
      const file = bucket.file(dynamicPath);

      await file.save(buffer, {
        metadata: {
          contentType: mimeType,
          cacheControl: 'public, max-age=3600',
        },
      });

      await file.makePublic();
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${dynamicPath}`;
      return { uploadedFileUrl: publicUrl };

    } catch (error) {
      console.error('Error in uploadCatalogPageAdImageFlow:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to upload catalog page ad image: ${error.message}`);
      }
      throw new Error('An unknown error occurred during catalog page ad image upload.');
    }
  }
);
    