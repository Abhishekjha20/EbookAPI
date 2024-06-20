import { Request, Response, NextFunction } from "express";
import path from "node:path";
import cloudinary from "../config/cloudinary";
import createHttpError from "http-errors";
import bookModel from "./bookModel";
import fs from 'node:fs';
import { AuthRequest } from "../middlewares/authenticate";

const createBook = async (req: Request, res: Response, next: NextFunction) => {

    const { title, genre } = req.body

    try {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };

        const coverImageMimeType = files.coverImage[0].mimetype.split('/').at(-1);  // mimetype like image type

        const fileName = files.coverImage[0].filename;

        const filePath = path.resolve(__dirname, '../../public/data/uploads', fileName)

        const uploadResult = await cloudinary.uploader.upload(filePath, {
            filename_override: __filename,
            folder: 'book-covers',
            format: coverImageMimeType,
        })

        const bookFileName = files.file[0].filename;
        const bookFilePath = path.resolve(
            __dirname,
            "../../public/data/uploads",
            bookFileName
        )

        const bookFileUploadResult = await cloudinary.uploader.upload(bookFilePath, {
            resource_type: 'raw',
            filename_override: bookFileName,
            folder: 'book-pdfs',
            format: "pdf"

        });

        // console.log("file Uploads result", uploadResult);
        // console.log("Book file upload result", bookFileUploadResult);

        // console.log('userid', req.userId)

        const _req = req as AuthRequest;

        const newBook = await bookModel.create({
            title,
            genre,
            // author: "666c92f64bc67095dfad23a7",  //hard coded 
            author: _req.userId,
            coverImage: uploadResult.secure_url,
            file: bookFileUploadResult.secure_url
        });


        // Delete temp files
        // wrap in try catch
        await fs.promises.unlink(filePath)
        await fs.promises.unlink(bookFilePath)

        res.status(201).json({ id: newBook._id })

    } catch (err) {
        return next(createHttpError(500, "Error while getting image and files"));
    }



};

export { createBook };