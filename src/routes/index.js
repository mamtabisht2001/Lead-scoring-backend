import offers from "./offerRoute.js";
import leads from "./leadRoute.js";

export default function (app) {
  app.use("/", offers);
  app.use("/", leads);
}
