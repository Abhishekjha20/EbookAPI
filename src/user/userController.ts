import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import userModel from "./userModel";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { config } from "../config/config";


const createUser = async (req: Request, res: Response, next: NextFunction) =>{
    const {name,email,password} = req.body;

    // validation
   if(!name || !email || !password){
    const error  = createHttpError(400, "All field are required");
    return next(error);
   }  

//    Database call 

const user = await userModel.findOne({ email });

if(user){
    const error  = createHttpError (400, "user already exist with this email.")
    return next(error);
}


// password hash

const passwordHashed = await bcrypt.hash(password, 10) // 10 sault rounds

const newUser = await userModel.create({
    name,
    email,
    password: passwordHashed,
});

// tokens generation
 const token = jwt.sign({sub: newUser._id}, config.jwtSecret as string, {expiresIn: '7d'});

   res.json({accessToken: token});
};

export {createUser};