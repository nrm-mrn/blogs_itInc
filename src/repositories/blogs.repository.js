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
exports.blogRepository = void 0;
const db_1 = require("../db/db");
const posts_repository_1 = require("./posts.repository");
exports.blogRepository = {
    createBlog(input) {
        return __awaiter(this, void 0, void 0, function* () {
            const newBlog = Object.assign({ id: (Date.now() + Math.random()).toString() }, input);
            try {
                db_1.db.blogs = [...db_1.db.blogs, newBlog];
            }
            catch (e) {
                return { blog: null, error: e.message };
            }
            return { blog: newBlog, error: null };
        });
    },
    findBlog(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.db.blogs.find(b => b.id === id);
        });
    },
    editBlog(id, input) {
        return __awaiter(this, void 0, void 0, function* () {
            const target = yield this.findBlog(id);
            if (!target) {
                return { error: 'Id does not exist' };
            }
            const updatedBlog = Object.assign({ id: target.id }, input);
            const targetIdx = db_1.db.blogs.findIndex(b => b.id === id);
            db_1.db.blogs.splice(targetIdx, 1, updatedBlog);
            if (target.name !== input.name) {
                posts_repository_1.postsRepository.updatePostsByBlogId(id, { blogName: updatedBlog.name });
            }
            return;
        });
    },
    deleteBlog(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const targetIdx = db_1.db.blogs.findIndex(b => b.id === id);
            if (targetIdx < 0) {
                return { error: 'Id does not exist' };
            }
            db_1.db.blogs.splice(targetIdx, 1);
            posts_repository_1.postsRepository.deletePostsByBlogId(id);
            return;
        });
    }
};
