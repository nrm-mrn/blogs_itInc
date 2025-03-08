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
describe('blogs routes tests', () => {
    let buff;
    let codedAuth;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        (0, db_1.setDb)();
        buff = Buffer.from(db_1.db.users[0].auth);
        codedAuth = buff.toString('base64');
    }));
    it('Should get 200 and an empty array', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield test_helpers_1.req.get(settings_1.SETTINGS.PATHS.BLOGS).expect(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(0);
    }));
    it('Should create blogs', () => __awaiter(void 0, void 0, void 0, function* () {
        const validBlog = {
            name: 'First blog',
            description: 'some description of the first blog',
            websiteUrl: 'https://google.com'
        };
        let res = yield test_helpers_1.req.post(settings_1.SETTINGS.PATHS.BLOGS).send(validBlog).expect(401);
        res = yield test_helpers_1.req.post(settings_1.SETTINGS.PATHS.BLOGS)
            .set({ 'authorization': 'Basic ' + codedAuth })
            .send(validBlog)
            .expect(201);
        expect(res.body.id).toEqual(expect.any(String));
        expect(res.body.name).toEqual(validBlog.name);
        expect(res.body.description).toEqual(validBlog.description);
        expect(res.body.websiteUrl).toEqual(validBlog.websiteUrl);
    }));
    it('Should get validation errors on update', () => __awaiter(void 0, void 0, void 0, function* () {
        const validBlog = {
            name: 'First blog',
            description: 'some description of the first blog',
            websiteUrl: 'https://google.com'
        };
        const valid_res = yield test_helpers_1.req.post(settings_1.SETTINGS.PATHS.BLOGS)
            .set({ 'authorization': 'Basic ' + codedAuth })
            .send(validBlog)
            .expect(201);
        const invalidBlog = {
            name: 'some invalid too long name',
            description: 'valid descr',
            websiteUrl: 'invalid',
        };
        const res = yield test_helpers_1.req.put(settings_1.SETTINGS.PATHS.BLOGS + `/${valid_res.body.id}`)
            .set({ 'authorization': 'Basic ' + codedAuth })
            .send(invalidBlog)
            .expect(400);
        expect(res.body.errorsMessages.length).toBe(2);
    }));
    it('Should update a blog', () => __awaiter(void 0, void 0, void 0, function* () {
        const validBlog = {
            name: 'BlogToUpd',
            description: 'some description of the updateable blog',
            websiteUrl: 'https://google.com'
        };
        const blogObj = yield test_helpers_1.req.post(settings_1.SETTINGS.PATHS.BLOGS)
            .set({ 'authorization': 'Basic ' + codedAuth })
            .send(validBlog)
            .expect(201);
        const update = {
            name: 'Updated',
            description: 'New one',
            websiteUrl: 'https://google.com/test',
        };
        let res = yield test_helpers_1.req.put(settings_1.SETTINGS.PATHS.BLOGS + `/${blogObj.body.id}`)
            .set({ 'authorization': 'Basic ' + codedAuth })
            .send(update)
            .expect(204);
        res = yield test_helpers_1.req.get(settings_1.SETTINGS.PATHS.BLOGS + `/${blogObj.body.id}`)
            .expect(200);
        expect(res.body.id).toEqual(blogObj.body.id);
        expect(res.body.name).toEqual(update.name);
        expect(res.body.description).toEqual(update.description);
        expect(res.body.websiteUrl).toEqual(update.websiteUrl);
    }));
    it('Should get blogs', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield test_helpers_1.req.get(settings_1.SETTINGS.PATHS.BLOGS).expect(200);
        expect(res.body.length).toBe(3);
    }));
    it('Should delete a blog', () => __awaiter(void 0, void 0, void 0, function* () {
        const validBlog = {
            name: 'Blog to del',
            description: 'some description of the updateable blog',
            websiteUrl: 'https://google.com'
        };
        const blogObj = yield test_helpers_1.req.post(settings_1.SETTINGS.PATHS.BLOGS)
            .set({ 'authorization': 'Basic ' + codedAuth })
            .send(validBlog)
            .expect(201);
        yield test_helpers_1.req.delete(settings_1.SETTINGS.PATHS.BLOGS + `/${blogObj.body.id}`)
            .expect(401);
        yield test_helpers_1.req.delete(settings_1.SETTINGS.PATHS.BLOGS + `/${blogObj.body.id}`)
            .set({ 'authorization': 'Basic ' + codedAuth })
            .expect(204);
        yield test_helpers_1.req.get(settings_1.SETTINGS.PATHS.BLOGS + `/${blogObj.body.id}`)
            .expect(404);
    }));
});
