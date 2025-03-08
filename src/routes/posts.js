"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postsRouter = void 0;
const express_1 = require("express");
const db_1 = require("../db/db");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validationResult_middleware_1 = require("../middlewares/validationResult.middleware");
const posts_repository_1 = require("../repositories/posts.repository");
const posts_validators_1 = require("./posts.validators");
exports.postsRouter = (0, express_1.Router)({});
exports.postsRouter.get('/', (req, res) => {
    const posts = db_1.db.posts;
    res.status(200).send(posts);
    return;
});
exports.postsRouter.post('/', auth_middleware_1.authMiddleware, posts_validators_1.postInputValidator, validationResult_middleware_1.inputValidationResultMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { post, error } = yield posts_repository_1.postsRepository.createPost(req.body);
    if (error !== null) {
        res.sendStatus(400);
        return;
    }
    res.status(201).send(post);
    return;
}));
exports.postsRouter.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const post = yield posts_repository_1.postsRepository.findPostById(req.params.id);
    if (!post) {
        res.sendStatus(404);
        return;
    }
    res.status(200).send(post);
    return;
}));
exports.postsRouter.put('/:id', auth_middleware_1.authMiddleware, posts_validators_1.postInputValidator, validationResult_middleware_1.inputValidationResultMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield posts_repository_1.postsRepository.editPost(req.params.id, req.body);
    if (result === null || result === void 0 ? void 0 : result.error) {
        res.sendStatus(404);
        return;
    }
    res.sendStatus(204);
    return;
}));
exports.postsRouter.delete('/:id', auth_middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield posts_repository_1.postsRepository.deletePost(req.params.id);
    if (result === null || result === void 0 ? void 0 : result.error) {
        res.sendStatus(404);
        return;
    }
    res.sendStatus(204);
    return;
}));
