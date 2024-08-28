module.exports = {
	apps: [
		{
			name: "gamgee",
			script: "./dist/server.js",
			node_args: ["--env-file=.env"],
			cwd: __dirname,
			source_map_support: true,
			watch: ["dist"],
			watch_delay: 1000,
			time: true,
			env: {
				NODE_ENV: "development",
			},
			env_production: {
				NODE_ENV: "production",
			},
		},
	],
};
