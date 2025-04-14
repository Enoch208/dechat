import { createRouteHandler } from "uploadthing/next";

import { ourFileRouter } from "@/app/lib/uploadthing";

// Export routes for Next App Router
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
}); 