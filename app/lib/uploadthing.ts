import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  // Define voice note uploader
  voiceNoteUploader: f({ audio: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      // This code runs on your server before upload
      return { userId: "anonymous" }; // Store anonymously
    })
    .onUploadComplete(async ({ file }) => {
      // This code runs on your server after upload
      console.log("Voice note file URL:", file.url);
      
      return { uploadedUrl: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter; 