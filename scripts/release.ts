import { assert, literal, string, type } from "superstruct";
import { join } from "node:path";
import { parser as changelogParser } from "keep-a-changelog";
import { parse as parseSemVer } from "semver";
import { readFileSync, writeFileSync } from "node:fs";

// Fixes the changelog's footer links and bumps the `version` in [package.json](/package.json) and [package-lock.json](/package-lock.json).
// This script may be run repeatedly on the same project.

function quote(str: string | undefined): string | undefined {
	if (str === undefined) return str;
	return `'${str}'`;
}

console.info("** release.ts **");

// Load the changelog
const changelogPath = join(__dirname, "../CHANGELOG.md");
const packageJsonPath = join(__dirname, "../package.json");
const packageLockJsonPath = join(__dirname, "../package-lock.json");
console.info("Loading changelog from", quote(changelogPath));

const rawChangelog = readFileSync(changelogPath, "utf-8");
const changelog = changelogParser(rawChangelog);

const releases = changelog.releases;

// Get current versioned release
const thisReleaseIdx = releases.findIndex(release => release.date && release.version);
const thisRelease = releases[thisReleaseIdx];
if (!thisRelease?.version) throw new TypeError("No versioned release was found.");

// Handy info
console.info("latest release:", thisRelease.version?.toString());

const prevRelease = releases[thisReleaseIdx + 1];
console.info("previous release:", prevRelease?.version?.toString());

// Fix the changelog's format (new compare links, etc.)
console.info("\n** Spec compliance **");

const newChangelog = changelog.toString();
writeFileSync(changelogPath, newChangelog);

// `git-diff` against the current CHANGELOG.md eats node_modules. Not sure why.
// Until that's worked out, don't bother diffing.
// const changelogDiff = gitDiff(rawChangelog, newChangelog);
const didFixChangelog = rawChangelog !== newChangelog;
if (!didFixChangelog) {
	console.info("Changelog was already spec compliant.");
} else {
	console.info("Fixed formatting for spec compliance.");
}

// Fix package.json and package-lock.json
console.info("\n** Version matching **");
const versioned = type({
	version: string()
});
const versionedLock = type({
	version: string(),
	lockfileVersion: literal(2),
	packages: type({
		"": type({
			version: string()
		})
	})
});

const packageJson: unknown = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
const packageLockJson: unknown = JSON.parse(readFileSync(packageLockJsonPath, "utf-8"));

assert(packageJson, versioned);
assert(packageLockJson, versionedLock);

const packageVersion = parseSemVer(packageJson.version);
const packageLockVersion = parseSemVer(packageLockJson.version);

if (!packageVersion)
	throw new TypeError(
		'The "version" field in package.json is not a compliant Semantic Version number'
	);

if (!packageLockVersion)
	throw new TypeError(
		'The "version" field in package-lock.json is not a compliant Semantic Version number'
	);

console.info("package.json version:", packageVersion.version);
console.info("package-lock.json version:", packageLockVersion.version);

if (packageVersion.version !== packageLockVersion.version)
	throw new EvalError(
		'The "version" fields in package.json and package-lock.json do not match. Please let CHANGELOG.md be the source of truth for versioning. To ignore this warning and proceed, please first run `npm install`.'
	);

// Update package.json
const oldPackageJson = `${JSON.stringify(packageJson, undefined, "\t")}\n`;
packageJson.version = thisRelease.version.version;
const newPackageJson = `${JSON.stringify(packageJson, undefined, "\t")}\n`;
writeFileSync(packageJsonPath, newPackageJson);

const didFixPackageJson = oldPackageJson !== newPackageJson;
if (!didFixPackageJson) {
	console.info("package.json already had the correct version.");
} else {
	console.info("Updated package.json version.");
}

// Update package-lock.json
const oldPackageLockJson = `${JSON.stringify(packageLockJson, undefined, "\t")}\n`;
// Maybe we should just run `npm i` instead?
packageLockJson.version = thisRelease.version.version;
packageLockJson.packages[""].version = thisRelease.version.version;
const newPackageLockJson = `${JSON.stringify(packageLockJson, undefined, "\t")}\n`;
writeFileSync(packageLockJsonPath, newPackageLockJson);

const didFixPackageLockJson = oldPackageLockJson !== newPackageLockJson;
if (!didFixPackageLockJson) {
	console.info("package-lock.json already had the correct version.");
} else {
	console.info("Updated package-lock.json version.");
}

// If we fixed the changelog or updated package.json, throw
if (didFixChangelog || didFixPackageJson || didFixPackageLockJson) {
	console.warn("⚠️  We made some changes. Please review them and re-run. ⚠️");
	process.exit(1); // this should fail us in CI
}
