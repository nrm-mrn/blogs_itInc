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
const db_1 = require("../src/db/db");
const settings_1 = require("../src/settings/settings");
const test_helpers_1 = require("./test-helpers");
describe('posts routes tests', () => {
    let buff;
    let codedAuth;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        const dbSeed = {
            blogs: [
                {
                    id: '1234',
                    name: 'first',
                    description: 'first blog desc',
                    websiteUrl: 'https://google.com'
                },
                {
                    id: '4321',
                    name: 'second',
                    description: 'second blog desc',
                    websiteUrl: 'https://google.com/test'
                },
            ]
        };
        (0, db_1.setDb)(dbSeed);
        buff = Buffer.from(db_1.db.users[0].auth);
        codedAuth = buff.toString('base64');
    }));
    it('should get 200 and empty array', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield test_helpers_1.req.get(settings_1.SETTINGS.PATHS.POSTS).expect(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(0);
    }));
    it('should get 404, wrong blogid', () => __awaiter(void 0, void 0, void 0, function* () {
        const post = {
            title: 'some title',
            shortDescription: 'short desc',
            content: 'some post content',
            blogId: '54232',
        };
        const res = yield test_helpers_1.req.post(settings_1.SETTINGS.PATHS.POSTS)
            .set({ 'authorization': 'Basic ' + codedAuth })
            .send(post)
            .expect(400);
    }));
    it('should create post', () => __awaiter(void 0, void 0, void 0, function* () {
        const post = {
            title: 'some title',
            shortDescription: 'short desc',
            content: 'some post content',
            blogId: db_1.db.blogs[0].id,
        };
        const res = yield test_helpers_1.req.post(settings_1.SETTINGS.PATHS.POSTS)
            .set({ 'authorization': 'Basic ' + codedAuth })
            .send(post)
            .expect(201);
        expect(res.body.id).toEqual(expect.any(String));
        expect(res.body.title).toEqual(post.title);
        expect(res.body.shortDescription).toEqual(post.shortDescription);
        expect(res.body.content).toEqual(post.content);
        expect(res.body.blogId).toEqual(post.blogId);
    }));
    it('should get a post', () => __awaiter(void 0, void 0, void 0, function* () {
        const post = {
            title: 'another title',
            shortDescription: 'short desc',
            content: 'some post content',
            blogId: db_1.db.blogs[0].id,
        };
        const res = yield test_helpers_1.req.post(settings_1.SETTINGS.PATHS.POSTS)
            .set({ 'authorization': 'Basic ' + codedAuth })
            .send(post)
            .expect(201);
        const resPost = yield test_helpers_1.req.get(settings_1.SETTINGS.PATHS.POSTS + `/${res.body.id}`);
        expect(resPost.body.id).toEqual(res.body.id);
    }));
    it('should update posts when the parent blog is updated', () => __awaiter(void 0, void 0, void 0, function* () {
        const updatedBlog = {
            id: '1234',
            name: 'updatedName',
            description: 'first blog desc',
            websiteUrl: 'https://google.com'
        };
        yield test_helpers_1.req.put(settings_1.SETTINGS.PATHS.BLOGS + `/${updatedBlog.id}`)
            .set({ 'authorization': 'Basic ' + codedAuth })
            .send(updatedBlog)
            .expect(204);
        const postsRes = yield test_helpers_1.req.get(settings_1.SETTINGS.PATHS.POSTS).expect(200);
        const posts = postsRes.body;
        posts.forEach(post => {
            expect(post.blogName).toEqual(updatedBlog.name);
        });
    }));
    it('should update a post', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const post = {
            title: 'updateable',
            shortDescription: 'short desc',
            content: 'some post content',
            blogId: db_1.db.blogs[1].id,
        };
        const res = yield test_helpers_1.req.post(settings_1.SETTINGS.PATHS.POSTS)
            .set({ 'authorization': 'Basic ' + codedAuth })
            .send(post)
            .expect(201);
        const invalidUpdate = {
            title: 'too long title for a post should get validation error',
            shortDescription: 'short desc',
            content: 'some post content',
            blogId: db_1.db.blogs[1].id,
        };
        yield test_helpers_1.req.put(settings_1.SETTINGS.PATHS.POSTS + `/${res.body.id}`)
            .set({ 'authorization': 'Basic ' + codedAuth })
            .send(invalidUpdate)
            .expect(400);
        const validUpdate = {
            title: 'this should work',
            shortDescription: 'short desc',
            content: 'some post content',
            blogId: db_1.db.blogs[1].id,
        };
        yield test_helpers_1.req.put(settings_1.SETTINGS.PATHS.POSTS + `/${res.body.id}`)
            .set({ 'authorization': 'Basic ' + codedAuth })
            .send(validUpdate)
            .expect(204);
        expect((_a = db_1.db.posts.find(p => p.id === res.body.id)) === null || _a === void 0 ? void 0 : _a.title).toEqual(validUpdate.title);
    }));
    it('should delete a post', () => __awaiter(void 0, void 0, void 0, function* () {
        const post = {
            title: 'Deleteable',
            shortDescription: 'short desc',
            content: 'some post content',
            blogId: db_1.db.blogs[1].id,
        };
        const res = yield test_helpers_1.req.post(settings_1.SETTINGS.PATHS.POSTS)
            .set({ 'authorization': 'Basic ' + codedAuth })
            .send(post)
            .expect(201);
        yield test_helpers_1.req.delete(settings_1.SETTINGS.PATHS.POSTS + `/${res.body.id}`)
            .expect(401);
        yield test_helpers_1.req.delete(settings_1.SETTINGS.PATHS.POSTS + `/${res.body.id}`)
            .set({ 'authorization': 'Basic ' + codedAuth })
            .expect(204);
        expect(db_1.db.posts.find(p => p.id === res.body.is)).toBeUndefined();
    }));
    it('should delete child posts when parent blog is deleted', () => __awaiter(void 0, void 0, void 0, function* () {
        const targetBlogId = db_1.db.blogs[0].id;
        const firstBlogPosts = db_1.db.posts.filter(p => p.blogId === targetBlogId);
        expect(firstBlogPosts.length).toBeGreaterThan(0);
        yield test_helpers_1.req.delete(settings_1.SETTINGS.PATHS.BLOGS + `/${targetBlogId}`)
            .set({ 'authorization': 'Basic ' + codedAuth })
            .expect(204);
        const updatedNumberPosts = db_1.db.posts.filter(p => p.blogId === targetBlogId);
        expect(updatedNumberPosts.length).toBe(0);
    }));
});
