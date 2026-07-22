import { createServer } from "http";
import { parse } from "url";
import next from "next";

// This custom server ensures the WhatsApp Manager runs in the main Node process
// instead of being instantiated in separate Next.js worker threads (App Router).
import { whatsappManager } from "./src/lib/whatsapp-manager";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  console.log("Next.js started. WhatsApp Manager is ready in the main process.");

  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  })
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
