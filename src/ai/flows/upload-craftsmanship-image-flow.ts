
'use server';
/**
 * @fileOverview A Genkit flow for uploading a craftsmanship section image to Firebase Storage.
 *
 * - uploadCraftsmanshipImage - A function that handles the image upload process.
 * - UploadCraftsmanshipImageInput - The input type for the function.
 * - UploadCraftsmanshipImageOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { adminStorage } from '@/lib/firebase-admin';

const UploadCraftsmanshipImageInputSchema = z.object({
  fileDataUri: z
    .string()
    .describe(
      "The craftsmanship image as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type UploadCraftsmanshipImageInput = z.infer<typeof UploadCraftsmanshipImageInputSchema>;

const UploadCraftsmanshipImageOutputSchema = z.object({
  uploadedFileUrl: z.string().url().describe('The public URL of the uploaded craftsmanship image.'),
});
export type UploadCraftsmanshipImageOutput = z.infer<typeof UploadCraftsmanshipImageOutputSchema>;

export async function uploadCraftsmanshipImage(input: UploadCraftsmanshipImageInput): Promise<UploadCraftsmanshipImageOutput> {
  return uploadCraftsmanshipImageFlow(input);
}

const uploadCraftsmanshipImageFlow = ai.defineFlow(
  {
    name: 'uploadCraftsmanshipImageFlow',
    inputSchema: UploadCraftsmanshipImageInputSchema,
    outputSchema: UploadCraftsmanshipImageOutputSchema,
  },
  async (input) => {
    try {
      const { fileDataUri } = input;

      const matches = fileDataUri.match(/^data:(image\/(.+));base64,(.+)$/);
      if (!matches || matches.length !== 4) {
        const genericMatches = fileDataUri.match(/^data:(.+);base64,(.+)$/);
        if (!genericMatches || genericMatches.length !== 3) {
          throw new Error('Invalid data URI format.');
        }
        const mimeType = genericMatches[1];
        const base64Data = genericMatches[2];
        const buffer = Buffer.from(base64Data, 'base64');
        const extension = mimeType.split('/')[1] || 'bin';
        
        const dynamicPath = `site-configuration/craftsmanship-image.${extension}`;
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
      }
      
      const mimeType = matches[1];
      const extension = matches[2]; 
      const base64Data = matches[3];
      const buffer = Buffer.from(base64Data, 'base64');

      const dynamicPath = `site-configuration/craftsmanship-image.${extension}`;

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
      console.error('Error in uploadCraftsmanshipImageFlow:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to upload craftsmanship image: ${error.message}`);
      }
      throw new Error('An unknown error occurred during craftsmanship image upload.');
    }
  }
);
    