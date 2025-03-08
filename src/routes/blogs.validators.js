"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blogInputValidation = void 0;
const express_validator_1 = require("express-validator");
const blogNameValidator = (0, express_validator_1.body)('name')
    .notEmpty().withMessage('Name should not be empty')
    .isString().withMessage('Name should be string')
    .trim()
    .isLength({ max: 15 }).withMessage('Name should not be longer than 15 symbols');
const blogDescrValidator = (0, express_validator_1.body)('description')
    .notEmpty().withMessage('Description should not be empty')
    .isString().withMessage('Description should be string')
    .trim()
    .isLength({ max: 500 }).withMessage('Description should be 500 characters max');
const blogWebsiteUrlValidator = (0, express_validator_1.body)('websiteUrl')
    .notEmpty().withMessage('Url should not be empty')
    .notEmpty().withMessage('Name should not be empty')
    .isString().withMessage('Website url should be string')
    .matches(/^https:\/\/([a-zA-Z0-9_-]+\.)+[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*\/?$/)
    .withMessage('Website url should be a valid url');
exports.blogInputValidation = [
    blogNameValidator,
    blogDescrValidator,
    blogWebsiteUrlValidator,
];
