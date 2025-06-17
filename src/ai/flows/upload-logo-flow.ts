'use server';
/**
 * @fileOverview A Genkit flow for uploading a logo to Firebase Storage.
 *
 * - uploadLogo - A function that handles the logo upload process.
 * - UploadLogoInput - The input type for the uploadLogo function.
 * - UploadLogoOutput - The return type for the uploadLogo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { adminStorage } from '@/lib/firebase-admin'; // Assuming firebase-admin is initialized here

const UploadLogoInputSchema = z.object({
  fileDataUri: z
    .string()
    .describe(
      "The logo image as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  // fileName: z.string().describe("The desired file name for the logo in storage."), // We'll use a fixed name
});
export type UploadLogoInput = z.infer<typeof UploadLogoInputSchema>;

const UploadLogoOutputSchema = z.object({
  uploadedFileUrl: z.string().url().describe('The public URL of the uploaded logo.'),
});
export type UploadLogoOutput = z.infer<typeof UploadLogoOutputSchema>;

// Define a fixed path and name for the site logo in Firebase Storage
const LOGO_STORAGE_PATH = 'site-configuration/logo.png';

export async function uploadLogo(input: UploadLogoInput): Promise<UploadLogoOutput> {
  return uploadLogoFlow(input);
}

const uploadLogoFlow = ai.defineFlow(
  {
    name: 'uploadLogoFlow',
    inputSchema: UploadLogoInputSchema,
    outputSchema: UploadLogoOutputSchema,
  },
  async (input) => {
    try {
      const { fileDataUri } = input;

      // Extract MIME type and Base64 data from Data URI
      const matches = fileDataUri.match(/^data:(.+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        throw new Error('Invalid data URI format.');
      }
      const mimeType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');

      const bucket = adminStorage.bucket(); // Get default bucket
      const file = bucket.file(LOGO_STORAGE_PATH);

      // Upload the file
      await file.save(buffer, {
        metadata: {
          contentType: mimeType,
          cacheControl: 'public, max-age=3600', // Cache for 1 hour, adjust as needed
        },
      });

      // Make the file public (alternatively, generate a signed URL if preferred for privacy)
      await file.makePublic();
      
      // Get the public URL
      // Note: For GCS, the public URL format is typically: https://storage.googleapis.com/[BUCKET_NAME]/[OBJECT_NAME]
      // Ensure your bucket is configured for public access or use signed URLs if more security is needed.
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${LOGO_STORAGE_PATH}`;

      return { uploadedFileUrl: publicUrl };

    } catch (error) {
      console.error('Error in uploadLogoFlow:', error);
      // It's good practice to throw a more specific error or handle it
      // depending on how you want client to react.
      if (error instanceof Error) {
        throw new Error(`Failed to upload logo: ${error.message}`);
      }
      throw new Error('An unknown error occurred during logo upload.');
    }
  }
);
