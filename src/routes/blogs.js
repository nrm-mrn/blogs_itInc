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
exports.blogsRouter = void 0;
const express_1 = require("express");
const db_1 = require("../db/db");
const blogs_repository_1 = require("../repositories/blogs.repository");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const blogs_validators_1 = require("./blogs.validators");
const validationResult_middleware_1 = require("../middlewares/validationResult.middleware");
exports.blogsRouter = (0, express_1.Router)({});
exports.blogsRouter.get('/', (req, res) => {
    const blogs = db_1.db.blogs;
    res.status(200).send(blogs);
    return;
});
exports.blogsRouter.post('/', auth_middleware_1.authMiddleware, blogs_validators_1.blogInputValidation, validationResult_middleware_1.inputValidationResultMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { blog, error } = yield blogs_repository_1.blogRepository.createBlog(req.body);
    res.status(201).send(blog);
    return;
}));
exports.blogsRouter.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const blog = yield blogs_repository_1.blogRepository.findBlog(req.params.id);
    if (!blog) {
        res.sendStatus(404);
        return;
    }
    res.status(200).send(blog);
    return;
}));
exports.blogsRouter.put('/:id', auth_middleware_1.authMiddleware, blogs_validators_1.blogInputValidation, validationResult_middleware_1.inputValidationResultMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield blogs_repository_1.blogRepository.editBlog(req.params.id, req.body);
    if (result === null || result === void 0 ? void 0 : result.error) {
        res.sendStatus(404);
        return;
    }
    res.sendStatus(204);
    return;
}));
exports.blogsRouter.delete('/:id', auth_middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield blogs_repository_1.blogRepository.deleteBlog(req.params.id);
    if (result === null || result === void 0 ? void 0 : result.error) {
        res.sendStatus(404);
        return;
    }
    res.sendStatus(204);
    return;
}));
