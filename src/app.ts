/* eslint-disable @typescript-eslint/no-unused-vars */
import express from "express";
import cors from "cors";
import globalErrorHandler from "./middlewares/globalErrorHandlers";
import userRouter from "./user/userRouter";
import bookRouter from "./book/bookRouter";
import { config } from "./config/config";

const app = express();

app.use(cors({
  // origin: 'http://localhost:3000',    //hard coded
  origin: config.frontendDomain,

}))

app.use(express.json());

// Routes---

// HTTP method
app.get("/", (req, res, next) => {
  res.json({ message: "Welcome to ebook api" });
});

app.use("/api/users", userRouter);

app.use("/api/books", bookRouter);

// Global error handler

app.use(globalErrorHandler);

export default app;
