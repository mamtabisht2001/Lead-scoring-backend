import offers from "./offerRoute.js";

export default function (app) {
  app.use("/", offers);
}
