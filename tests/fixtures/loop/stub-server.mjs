/**
 * A stand-in for `npx next dev` in the server test: a parent process that answers nothing itself and
 * spawns a grandchild that holds the port.
 *
 * That is the shape the real thing has — npx, or next dev and its workers — and it is what the test
 * needs: killing the parent alone leaves the grandchild listening, so only a signal to the whole
 * process group frees the port.
 */
import { spawn } from "node:child_process";

const port = Number(process.argv[2]);
const server = `
  import http from "node:http";
  http
    .createServer((_request, response) => {
      response.writeHead(200, { "content-type": "text/html" });
      response.end("<html><body>stub</body></html>");
    })
    .listen(${port}, "127.0.0.1");
  setInterval(() => {}, 1000);
`;

spawn(process.execPath, ["--input-type=module", "-e", server], { stdio: "ignore" });
setInterval(() => {}, 1000);
