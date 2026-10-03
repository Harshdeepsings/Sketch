import { Router } from "express";
import { UserMiddleware } from "../Middleware";

const CanvasRoutes = Router();

CanvasRoutes.post("create", UserMiddleware, (req, res) => {

});

CanvasRoutes.delete("delete", UserMiddleware, (req, res) => {

});

export default CanvasRoutes;