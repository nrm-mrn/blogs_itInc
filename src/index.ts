import { createApp } from "./app";
import { runDb } from "./db/mongoDb";
import { SETTINGS } from "./settings/settings";

const startApp = async () => {
  const res = await runDb();
  if (!res) process.exit(1);

  const app = createApp();

  app.listen(SETTINGS.PORT, () => {
    console.log(`Server started on port` + SETTINGS.PORT)
  })
}

startApp()

