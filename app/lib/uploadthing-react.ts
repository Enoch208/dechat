// Import from the uploadthing/react library
import {
  generateReactHelpers,
  generateUploadButton,
  generateUploadDropzone,
  generateUploader
} from "@uploadthing/react";

import type { OurFileRouter } from "@/app/api/uploadthing/core";

// Generate the React helpers for file upload
export const { useUploadThing, uploadFiles } =
  generateReactHelpers<OurFileRouter>();

// Generate the pre-built components (optional)
export const UploadButton = generateUploadButton<OurFileRouter>();
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();
export const Uploader = generateUploader<OurFileRouter>();

// Add global type for UploadThing token
declare global {
  interface Window {
    __UPLOADTHING_TOKEN?: string;
  }
} 