import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import userModel from "./userModel";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { config } from "../config/config";
import { User } from "./userTypes";

// Create User endpoint start_________________________________________________________________

const createUser = async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password } = req.body;

    // validation
    if (!name || !email || !password) {
        const error = createHttpError(400, "All field are required");
        return next(error);
    }

    //    Database call 

    try {
        const user = await userModel.findOne({ email });

        if (user) {
            const error = createHttpError(400, "user already exist with this email.")
            return next(error);
        }
    } catch (err) {
        return next(createHttpError(500, "Error while getting user"))
    }



    // password hash

    const passwordHashed = await bcrypt.hash(password, 10) // 10 sault rounds

    let newUser: User;

    try {

        newUser = await userModel.create({
            name,
            email,
            password: passwordHashed,
        });
    } catch (err) {
        return next(createHttpError(500, "error white creating user"))
    }

    // tokens generation

    try {
        const token = jwt.sign({ sub: newUser._id }, config.jwtSecret as string, { expiresIn: '7d' });

        res.status(201).json({ accessToken: token });

    } catch (err) {
        return next(createHttpError(500, "Error while signing the jwt token"))
    }
};

// Create  point End_________________________________________________________________________________


// Login endpoint start___________________________________________________________________

const loginUser = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    // validation
    if (!email || !password) {
        return next(createHttpError(400, "Email and password is required"));
    }

    try {

        const user = await userModel.findOne({ email });
        if (!user) {
            return next(createHttpError(404, "User not found"));
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return next(createHttpError(400, "username and password incorrect"))
        }

        //  create access Token

        const token = jwt.sign({ sub: user._id }, config.jwtSecret as string,
            {
                expiresIn: '7d'

            });
        res.json({ accessToken: token });

    } catch (err) {
        return next(createHttpError(500, "error while getting user"))
    }
}

// Login endpoint end__________________________________________________________________

export { createUser, loginUser };