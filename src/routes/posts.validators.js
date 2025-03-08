"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postInputValidator = void 0;
const express_validator_1 = require("express-validator");
const postTitleValidator = (0, express_validator_1.body)('title')
    .notEmpty().withMessage('Title should not be empty')
    .isString().withMessage('Title should be string')
    .trim()
    .isLength({ max: 30 }).withMessage('Title should not be longer than 30 symbols');
const postDescrValidator = (0, express_validator_1.body)('shortDescription')
    .notEmpty().withMessage('Description should not be empty')
    .isString().withMessage('Description should be string')
    .trim()
    .isLength({ max: 100 }).withMessage('Description should be 100 characters max');
const postContentValidator = (0, express_validator_1.body)('content')
    .notEmpty().withMessage('Body should not be empty')
    .isString().withMessage('Content should be string')
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Content should be 1000 characters max');
exports.postInputValidator = [
    postTitleValidator,
    postDescrValidator,
    postContentValidator,
];
