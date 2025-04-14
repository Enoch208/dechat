"use client";

import { useEffect } from "react";

// Set up the UploadThing token from environment variables
export default function UploadThingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Ensure token is set properly as soon as the component mounts
    const token = "eyJhcGlLZXkiOiJza19saXZlX2Y4NjIxODc2YjkzMjEzMjE2ZjMwY2M5YTVmZDhjMDhlZTkwNWI3YzhhNDc2NWYzMjIyN2I1MjkwNmU0NGNjYjkiLCJhcHBJZCI6InM2bWw2anI5NmMiLCJyZWdpb25zIjpbInNlYTEiXX0=";
    
    // Set both the newer __UPLOADTHING_TOKEN and legacy UPLOADTHING_TOKEN
    window.__UPLOADTHING_TOKEN = token;
    
    // @ts-expect-error - This is for legacy support
    window.UPLOADTHING_TOKEN = token;
    
    // For debugging - remove in production
    console.log("UploadThing token initialized:", !!window.__UPLOADTHING_TOKEN);
  }, []);

  return <>{children}</>;
} 