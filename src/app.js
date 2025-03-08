"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
const settings_1 = require("./settings/settings");
_1.app.listen(settings_1.SETTINGS.PORT, () => {
    console.log(`Server started on port` + settings_1.SETTINGS.PORT);
});
