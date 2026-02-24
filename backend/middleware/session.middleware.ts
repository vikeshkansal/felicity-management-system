import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

/*
this file provides the middleware to check if the user is logged in or not.
It uses JWT to verify the token
the user always has to send the JWT in the header as "Bearer <token>"
and then that token is verified to be correct by the server as the server
regenerates what the token should have been given the header/payload using its
own JWT_SECRET
it also does role-based access control; it checks if the given dude is supposed to be
allowed access or not, and blank input means everyone is allowed access
*/

const sessionMiddleware = (allowedRoles: string[] = []) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const header = req.headers.authorization;
        if (!header || !header.startsWith("Bearer ")) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const token = header.split(" ")[1];

        if (!token) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        try {
            const decodedToken = jwt.verify(token, process.env.JWT_SECRET as string) as { role: string;[key: string]: any };
            res.locals.user = decodedToken;
            if (allowedRoles.length > 0) {
                if (!allowedRoles.includes(decodedToken.role)) {
                    res.status(403).json({ message: "Access forbidden!" });
                    return;
                }
            }
            next();
        } catch (error) {
            res.status(401).json({ message: "Invalid token!" });
        }
    };
};

export default sessionMiddleware;