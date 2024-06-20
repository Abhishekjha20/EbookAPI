import path from "node:path";
import express from "express";
import { createBook } from "./bookController";
import multer from "multer";
import authenticate from "../middlewares/authenticate";

const bookRouter = express.Router();

const upload = multer({
    dest: path.resolve(__dirname, '../../public/data/uploads'),

    // put limit 10 mb___
    limits: { fileSize: 3e7 }  // 30mb 
})

bookRouter.post("/",

    authenticate,  //middleware

    upload.fields([       //single, fields -> single-single file, fields-for multiple file
        { name: 'coverImage', maxCount: 1 },
        { name: 'file', maxCount: 1 }
    ]),
    createBook
);


export default bookRouter;