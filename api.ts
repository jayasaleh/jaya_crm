import app from "./be/src/index";
import { VercelRequest, VercelResponse } from "@vercel/node";

export default (req: VercelRequest, res: VercelResponse) => {
  return app(req, res);
};
