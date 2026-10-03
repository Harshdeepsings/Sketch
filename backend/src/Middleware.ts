import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface AuthRequest extends Request{
            userId?: string
};

interface JwtPayload{
    id: string
};

export function UserMiddleware(req: AuthRequest, res: Response, next: NextFunction){
    try{

        const AuthHeader = req.headers.authorization;

        if(!AuthHeader || !AuthHeader.startsWith("bearer ")){
            res.status(401).json({
                message: "You Are Not Authenticated"
            });
            return
        }

        const token = AuthHeader.split(" ")[1];

        if(!token){
            res.status(401).json({
                message: "You Are Not Authenticated"
            });
        }

        const decoded = jwt.verify(token as string, process.env.JWT_ACCESS_SECRET as string) as JwtPayload;

        req.userId = decoded.id;

        next();

    }catch(e){
         res.status(401).json({
            message: "Invalid Or Expired Token"
        });
    }
};