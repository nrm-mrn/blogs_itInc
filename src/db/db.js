"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setDb = exports.db = void 0;
exports.db = {
    users: [],
    blogs: [],
    posts: [],
};
const setDb = (dataset) => {
    //always set an admin user
    exports.db.users = [{ auth: 'admin:qwerty' }];
    if (!dataset) {
        exports.db.blogs = [];
        exports.db.posts = [];
        return;
    }
    exports.db.blogs = dataset.blogs || exports.db.blogs;
    exports.db.posts = dataset.posts || exports.db.posts;
};
exports.setDb = setDb;
