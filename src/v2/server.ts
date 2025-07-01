/* s4yt-api Version 2
 *
 * @App Creation Date: February 22nd, 2024
 * @Last Updated: April 16, 2025
 *
 * @Author Krzysztof Garbos
 * @Contributors David Bishop, Krzysztof Garbos, Jonathan Lam, Shema Dabiri, Siddhanth Subramanian, Soham Desai, Akpevwen Sebastian Gbudje  
 *
 * @Description This is the special event/'game', called Dollars for Your Thoughts ($4YT), back-end REST API for Building-u.
 */

import express from "express";
import dotenv from "dotenv";

import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";

import helmet from "helmet";
import hpp from "hpp";
import rateLimit from "express-rate-limit";

import connectDB from "./db/db";
import lowercaseEmails from "./middleware/lowercaseEmails";
import { routeErrorHandler } from "./middleware/errorHandler";
import { setupLogger } from "./utils/logger";
import { initializeSocket } from "./utils/socket-emitter/index";

import adminRouter from "./admin/routes/admRoute";
import authRouter from "./authentication/routes/authRoute";
import gameRouter from "./game/routes/gameRoute";
import busRouter from "./business/routes/busRoute";
import locationRouter from "./location/routes/locationRoutes";

// Connect DB
const app = express();
dotenv.config();

connectDB();

const PORT = Number(process.env.PORT) || 4000,
  baseUrl = "/api/v2";

// **Middleware**
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://s4yt.org"
    ],
    credentials: true,
    exposedHeaders: ["Authorization", "x-xsrf-token"] // Expose bearer and CSRF tokens to frontend.
  })
);

// *Security*
app.use(helmet()); // Protects various HTTP headers that can help defend against common web hacks.
app.use(hpp()); // Protects against HTTP Parameter Pollution attacks.

// Rate-limiting - used to limit repeated requests.
app.use(rateLimit({
  windowMs: 5 * 60 * 1000, // 5 Minutes
  max: 100, // limit each IP to 100 requests per windowMs.
  message: "Too many requests made from this IP, please try again after 5 minutes."
}));

// Request logger.
setupLogger(app);

// *Custom*
app.use(lowercaseEmails);

// *Router*
app.use(`${baseUrl}/admin`, adminRouter);
app.use(`${baseUrl}/auth`, authRouter);
app.use(`${baseUrl}/game`, gameRouter);
app.use(`${baseUrl}/business`, busRouter);
app.use(`${baseUrl}/location`, locationRouter);
app.use(routeErrorHandler);

const server = app.listen(PORT, process.env.HOST as string, () =>
  console.log(
    `Server is running on ${process.env.PROTOCOL}${process.env.HOST}:${PORT}; Ctrl-C to terminate...`
  )
);

initializeSocket(server);