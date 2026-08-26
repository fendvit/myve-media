/**
 * Builds the Android App Bundle for Play upload.
 *
 * Exists as a script rather than an inline npm command for two reasons: the
 * Gradle wrapper is invoked differently per platform (and this machine has
 * NoDefaultCurrentDirectoryInExePath set, so cmd needs the explicit `.\` form),
 * and an AAB built without a keystore comes out unsigned. Gradle reports that
 * build as successful — Play only rejects it minutes later, at upload, with a
 * message that doesn't obviously point back here. Better to say so up front.
 */
import { execFileSync } from "child_process";
import path from "path";
import fs from "fs";
import os from "os";

const ANDROID = path.resolve("android");

// Kept outside the repo on purpose — this working copy is inside a OneDrive
// folder, so a keystore stored in it would sync to the cloud. Must match the
// lookup in android/app/build.gradle.
const KEYSTORE_PROPS =
  process.env.MYVE_KEYSTORE_PROPERTIES ??
  path.join(os.homedir(), ".keys", "myve-android", "keystore.properties");

// A .bat needs an interpreter, but going through `shell: true` would splice the
// arguments into a command string — and this repo's path is full of spaces and
// diacritics. Naming cmd explicitly keeps the arguments as an array.
const isWindows = process.platform === "win32";
// The `.\` is load-bearing: this machine has NoDefaultCurrentDirectoryInExePath
// set, so cmd won't resolve a bare `gradlew.bat` out of the working directory.
const [wrapper, wrapperArgs] = isWindows
  ? ["cmd", ["/c", ".\\gradlew.bat"]]
  : ["./gradlew", [] as string[]];

if (!fs.existsSync(path.join(ANDROID, "gradlew"))) {
  console.error("No android/ project found. Run `npx cap add android` first.");
  process.exit(1);
}

/**
 * Checks the signing setup is complete rather than just present. A properties
 * file with blank passwords, or one pointing at a keystore that isn't there,
 * fails deep inside Gradle with a message that doesn't name this file — and a
 * missing file produces a clean-looking build that Play rejects at upload.
 */
function signingProblem(): string | null {
  if (!fs.existsSync(KEYSTORE_PROPS)) {
    return `No keystore config at ${KEYSTORE_PROPS}. Copy android/keystore.properties.example there and fill it in, or set MYVE_KEYSTORE_PROPERTIES to point at it.`;
  }

  const props = Object.fromEntries(
    fs
      .readFileSync(KEYSTORE_PROPS, "utf8")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const at = line.indexOf("=");
        return [line.slice(0, at).trim(), line.slice(at + 1).trim()];
      }),
  );

  const blank = ["storeFile", "storePassword", "keyAlias", "keyPassword"].filter((k) => !props[k]);
  if (blank.length) {
    return `${KEYSTORE_PROPS} has no value for: ${blank.join(", ")}`;
  }

  // Relative paths resolve next to the properties file, matching build.gradle.
  const store = path.resolve(path.dirname(KEYSTORE_PROPS), props.storeFile);
  if (!fs.existsSync(store)) {
    return `storeFile points at ${props.storeFile}, which doesn't exist next to the properties file. keytool saves relative to the directory you ran it from — check where it landed.`;
  }

  return null;
}

const problem = signingProblem();
const signed = problem === null;

if (problem && fs.existsSync(KEYSTORE_PROPS)) {
  // Half-configured signing can't produce anything useful: Gradle would try to
  // sign, fail several minutes in, and blame the keystore rather than this file.
  console.error(`\n  Signing is set up but incomplete, so this build would fail.\n  ${problem}\n`);
  process.exit(1);
}

if (problem) {
  // No keystore at all is a legitimate way to get a build for local testing.
  console.warn(`\n  This bundle will be UNSIGNED and Google Play will reject it.\n  ${problem}\n`);
}

execFileSync(wrapper, [...wrapperArgs, "bundleRelease"], {
  cwd: ANDROID,
  stdio: "inherit",
});

const aab = path.join(ANDROID, "app/build/outputs/bundle/release/app-release.aab");
if (!fs.existsSync(aab)) {
  console.error("Gradle finished but no bundle was produced.");
  process.exit(1);
}

const mb = (fs.statSync(aab).size / 1024 / 1024).toFixed(1);
console.log(`\n${signed ? "Signed" : "UNSIGNED"} bundle (${mb} MB): ${path.relative(process.cwd(), aab)}`);
