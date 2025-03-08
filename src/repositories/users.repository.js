"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdmin = void 0;
const db_1 = require("../db/db");
const getAdmin = () => {
    return db_1.db.users[0];
};
exports.getAdmin = getAdmin;
