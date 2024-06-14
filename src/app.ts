import express, { Request, Response, NextFunction } from "express";
import createHttpError, { HttpError } from "http-errors";
import globalErrorHandler from "./middlewares/globalErrorHandlers";
import userRouter from "./user/userRouter";

const app = express();
app.use(express.json());

// Routes---

// HTTP method
app.get("/", (req, res, next) => {
  const error = createHttpError(400, "Something went wrong");
  throw error;
  res.json({ message: "Welcome to ebook api" });
});

app.use("/api/users", userRouter);

// Global error handler

app.use(globalErrorHandler);

export default app;
