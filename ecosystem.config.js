const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  apps: [
    {
      name: "gamgee",
      script: "./dist/main.js",
      env: {
        NODE_ENV: "development"
      },
      env_production: {
        NODE_ENV: "production"
      },
      env_webhook: {
        port: 23928,
        path: "/",
        secret: process.env["WEBHOOK_SECRET"]
      }
    }
  ]
};
