import { Router } from "express";
import { UserSchema } from "../UserValidation";
import { UserModel } from "../db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserMiddleware } from "../Middleware";

const UserRoutes = Router();

UserRoutes.post("signup", async (req, res) => {
    
    const ParsedDataWithSuccess = UserSchema.safeParse(req.body);
    
    if(!ParsedDataWithSuccess){
        res.status(401).json({
            message: "Invalid Credentials"
        });
    }


    const username = req.body.user;
    const password = req.body.password;
    const email = req.body.email;

    const HashedPassword = await bcrypt.hash(password, 10);

    try{
        UserModel.create({
        username: username,
        password: HashedPassword,
        email: email
        })

        res.status(200).json({
            message: "Signed Up Successfully"
        });

    }catch(e: any){
        if(e.code == 11000){
            res.status(409).json({
            message: "Username Or Email Already Exists"
            });
        }
        res.status(500).json({
            message: "Something Went Wrong !!!!"
        });
        
    }
    

});

UserRoutes.post("signin", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    
    if(!username || !password){
        res.status(400).json({
            message: "Username And Password Required"
        });
        
    }

    try{
        const User = await UserModel.findOne({
        username: username
    });
    
        if(!User){
            res.status(401).json({
                message: "Invalid Credentials"
            })
            return
        }

        const PasswordMatch = await bcrypt.compare(password, User.password);

        if(!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET){
            res.status(401).json({
                message: "You Are Not Authenticated"
            })
            return
        }


        if(User && PasswordMatch){
            const AccessToken = jwt.sign({
                id: User._id
            }, process.env.JWT_ACCESS_SECRET as string,{
                expiresIn: "15m"
            });

            const RefreshToken = jwt.sign({
                id: User._id
            }, process.env.JWT_REFRESH_SECRET as string,{
                expiresIn: "7d"
            });

            res.cookie("RefreshToken", RefreshToken, {
                httpOnly: true,
                secure: false,
                sameSite: "strict",
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });

            res.status(200).json({
                AccessToken
            });

        }else{
            res.status(401).json({
                 message: "Invalid Credentials"
            });
        };
    

    }catch(e){
        res.status(500).json({
            message: "Something Went Wrong !!!!"
        });
    }

    
});

UserRoutes.post("show", UserMiddleware, (req, res) => {

});

UserRoutes.post("logout", UserMiddleware, async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    
    if(!username || !password){
        res.status(400).json({
            message: "Username And Password Required"
        });
        
    }

    try{
        const User = await UserModel.findOne({
            username: username
        });
    
        if(!User){
            res.status(401).json({
                message: "Invalid Credentials"
            })
            return
        }

        res.clearCookie("RefreshToken", {
            httpOnly: true,
            secure: false,
            sameSite: "strict",
        });

        res.status(200).json({
            message: "Logged out successfully",
        });

    }catch(e){
        res.status(500).json({
            message: "Something Went Wrong !!!!"
        });
    }

});


export default UserRoutes;