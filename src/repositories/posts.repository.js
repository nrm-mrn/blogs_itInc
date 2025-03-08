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
exports.postsRepository = void 0;
const db_1 = require("../db/db");
exports.postsRepository = {
    createPost(input) {
        return __awaiter(this, void 0, void 0, function* () {
            const parentBlog = db_1.db.blogs.find(b => b.id === input.blogId);
            if (!parentBlog) {
                return { post: null, error: 'BlogId does not exist' };
            }
            const newPost = Object.assign({ id: (Date.now() + Math.random()).toString(), blogName: parentBlog.name }, input);
            try {
                db_1.db.posts = [...db_1.db.posts, newPost];
            }
            catch (e) {
                return { post: null, error: e.message };
            }
            return { post: newPost, error: null };
        });
    },
    findPostById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.db.posts.find(b => b.id === id);
        });
    },
    editPost(id, input) {
        return __awaiter(this, void 0, void 0, function* () {
            const target = yield this.findPostById(id);
            if (!target) {
                return { error: 'Id does not exist' };
            }
            const updatedPost = Object.assign({ id: target.id, blogName: target.blogName }, input);
            const targetIdx = db_1.db.posts.findIndex(b => b.id === id);
            db_1.db.posts.splice(targetIdx, 1, updatedPost);
            return;
        });
    },
    updatePostsByBlogId(blogId, input) {
        return __awaiter(this, void 0, void 0, function* () {
            const targetPosts = yield this.findPostsByBlogId(blogId);
            for (const post of targetPosts) {
                const updated = Object.assign(Object.assign({}, post), input);
                yield this.editPost(updated.id, updated);
            }
            return;
        });
    },
    findPostsByBlogId(blogId) {
        return __awaiter(this, void 0, void 0, function* () {
            const targetPosts = db_1.db.posts.filter(p => p.blogId === blogId);
            return targetPosts;
        });
    },
    deletePostsByBlogId(blogId) {
        return __awaiter(this, void 0, void 0, function* () {
            const posts = yield this.findPostsByBlogId(blogId);
            if (!posts.length) {
                return;
            }
            posts.forEach(post => {
                this.deletePost(post.id);
            });
        });
    },
    deletePost(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const targetIdx = db_1.db.posts.findIndex(b => b.id === id);
            if (targetIdx < 0) {
                return { error: 'Id does not exist' };
            }
            db_1.db.posts.splice(targetIdx, 1);
            return;
        });
    }
};
