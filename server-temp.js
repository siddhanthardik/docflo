import { createServer } from "http";
import { parse } from "url";
import next from "next";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  // Initialize the WhatsApp Manager inside the persistent server
  console.log("Next.js started. Initializing WhatsApp Manager...");
  
  // Dynamic import so it compiles/transpiles correctly if needed,
  // but since server.js is plain JS, we might need a ts-node or run it via tsx.
  // Wait, Next.js 'next start' runs the build, but running custom server usually requires compiling server.ts or using ts-node.
  // A cleaner approach for Next.js 13+ app router is to instantiate a global singleton inside a standard file,
  // but it's tricky with hot-reloading. Let's see if we can just use a singleton in `src/lib/whatsapp.ts`.
});
