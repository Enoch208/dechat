import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define voice note uploader with proper configuration
  voiceNoteUploader: f({
    audio: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      // This code runs on your server before upload
      // Simple anonymous auth since we're using phrases for authentication
      return { userId: "anonymous" };
    })
    .onUploadComplete(async ({ file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Voice note upload complete, URL:", file.url);
      
      // Return the URL to the client
      return { url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter; 