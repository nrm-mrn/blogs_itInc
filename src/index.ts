import { app } from "./app";
import { nodemailerService } from "./auth/email.service";
import { runDb } from "./db/mongoDb";
import { SETTINGS } from "./settings/settings";

const startApp = async () => {
  const res = await runDb(SETTINGS.MONGO_URL);
  if (!res) process.exit(1);

  nodemailerService.verifyConnection()

  app.listen(SETTINGS.PORT, () => {
    console.log(`Server started on port` + SETTINGS.PORT)
  })
}

startApp()

