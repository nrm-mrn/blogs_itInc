"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.req = void 0;
const supertest_1 = require("supertest");
const src_1 = require("../src");
exports.req = (0, supertest_1.agent)(src_1.app);
