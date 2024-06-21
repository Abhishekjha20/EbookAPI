import { Request, Response, NextFunction } from "express";
import path from "node:path";
import cloudinary from "../config/cloudinary";
import createHttpError from "http-errors";
import bookModel from "./bookModel";
import fs from 'node:fs';
import { AuthRequest } from "../middlewares/authenticate";

//_____________________Create Book_____________________________________

const createBook = async (req: Request, res: Response, next: NextFunction) => {

    try {
        const { title, genre } = req.body
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
        return next(createHttpError(500, "Error while creating image and files"));
    }



};

// _____________________UPDATE BOOK_____________________________________

const updateBook = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { title, genre } = req.body;
        const bookId = req.params.bookId;
        const book = await bookModel.findOne({ _id: bookId });

        if (!book) {
            return next(createHttpError(404, "Book not found"))
        }

        // check access

        const _req = req as AuthRequest;
        if (book.author.toString() != _req.userId) {
            return next(createHttpError(403, "You cannot update other book"))
        }


        // check if image fields is exist..
        const files = req.files as { [fieldName: string]: Express.Multer.File[] };
        let completeCoverImage = "";
        if (files.coverImage) {
            const filename = files.coverImage[0].filename;
            const converMimiType = files.coverImage[0].mimetype.split("/").at(-1);


            // send files to cloudinaru
            const filePath = path.resolve(
                __dirname,
                "../../public/data/uploads/" + filename
            );
            completeCoverImage = filename;
            const uploadResult = await cloudinary.uploader.upload(filePath, {
                filename_override: completeCoverImage,
                folder: "book-covers",
                format: converMimiType,
            });

            completeCoverImage = uploadResult.secure_url;
            await fs.promises.unlink(filePath);
        }


        // check if file fields is exist

        let completeFileName = "";
        if (files.file) {
            const bookFilePath = path.resolve(
                __dirname,
                "../../public/data/uploads/" + files.file[0].filename
            )

            const bookFileName = files.file[0].filename;
            completeFileName = bookFileName;

            const uploadResultPdf = await cloudinary.uploader.upload(bookFilePath, {
                resource_type: "raw",
                filename_override: completeFileName,
                folder: "books-pdfs",
                format: "pdf",
            });

            completeFileName = uploadResultPdf.secure_url;
            await fs.promises.unlink(bookFilePath);
        }

        const updateBook = await bookModel.findOneAndUpdate(
            {
                _id: bookId,

            },
            {
                title: title,
                genre: genre,
                coverImage: completeCoverImage ? completeCoverImage : book.coverImage,
                file: completeFileName ? completeFileName : book.file,

            },

            { new: true }
        );

        res.json(updateBook);

    } catch (err) {
        return next(createHttpError(500, "Error while updating profile"))
    }
}

// ______________________Get Book List_____________________________________________

const listBooks = async (req: Request, res: Response, next: NextFunction) => {
    try {
        //  add pagination___
        const book = await bookModel.find();
        res.json(book);

    } catch (err) {
        return next(createHttpError(500, "Error while getting list"))
    }
}

//_____________________Get single book______________________________________________

const getSingleBook = async (req: Request, res: Response, next: NextFunction) => {

    const bookId = req.params.bookId;
    try {
        const book = await bookModel.findOne({
            _id: bookId
        })

        if (!book) {
            return next(createHttpError(404, "book not found"))
        }

        return res.json(book)

    } catch (err) {
        return next(createHttpError(500, "Error while getting single book"))
    }
}

// _________________________Delete__________________________________________________

const bookDelete = async (req: Request, res: Response, next: NextFunction) => {

    const bookId = req.params.bookId;

    try {
        const book = await bookModel.findOne({
            _id: bookId,
        })

        if (!book) {
            return next(createHttpError(404, "Book not found"))
        }

        // check access___
        const _req = req as AuthRequest;
        if (book.author.toString() != _req.userId) {
            return next(createHttpError(403, "You cannot delete the book"))
        }

        //book-covers/cfwtl1ezvwtx9hn8wiu5

        const coverFileSplits = book.coverImage.split('/');

        const coverImagePublicId = coverFileSplits.at(-2) + '/' + (coverFileSplits.at(-1)?.split('.').at(-2));

        //  console.log("coverFileSplits", coverFileSplits)
        console.log("coverImagePublicId ", coverImagePublicId);

        const booFileSplits = book.file.split('/');
        const bookFilePublicId = booFileSplits.at(-2) + '/' + booFileSplits.at(-1);

        // console.log("bookFilePublicId", bookFilePublicId)

        await cloudinary.uploader.destroy(coverImagePublicId);
        await cloudinary.uploader.destroy(bookFilePublicId, {
            resource_type: "raw"
        });

        // record delete for db_

        await bookModel.deleteOne({ _id: bookId })

        return res.sendStatus(204);

    } catch (err) {
        return next(createHttpError(500, "Error while Deleting book"))
    }
}




export { createBook, updateBook, listBooks, getSingleBook, bookDelete };