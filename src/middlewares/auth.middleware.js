"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const users_repository_1 = require("../repositories/users.repository");
const authMiddleware = (req, res, next) => {
    const auth = req.headers.authorization; // Basic xxxx
    if (!auth) {
        res.status(401).send({});
        return;
    }
    const buff = Buffer.from(auth.slice(6), 'base64');
    const decodedAuth = buff.toString('utf8');
    if (decodedAuth !== (0, users_repository_1.getAdmin)().auth || auth.slice(0, 5) !== 'Basic') {
        res.status(401).send({});
        return;
    }
    next();
};
exports.authMiddleware = authMiddleware;
