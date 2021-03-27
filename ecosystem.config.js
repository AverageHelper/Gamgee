module.exports = {
  apps: [
    {
      name: "gamgee",
      script: "./dist/main.js",
      cwd: __dirname,
      source_map_support: true,
      watch: ["dist"],
      watch_delay: 1000,
      env: {
        NODE_ENV: "development"
      },
      env_production: {
        NODE_ENV: "production"
      }
    }
  ]
};
