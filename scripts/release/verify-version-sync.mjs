import { readFileSync } from 'node:fs';

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const tauriConfig = JSON.parse(readFileSync('src-tauri/tauri.conf.json', 'utf8'));
const cargoToml = readFileSync('src-tauri/Cargo.toml', 'utf8');

const cargoVersionMatch = cargoToml.match(/^version\s*=\s*"([^"]+)"/m);
if (!cargoVersionMatch) {
  fail('Could not find version in src-tauri/Cargo.toml');
}

const versions = {
  packageJson: packageJson.version,
  tauriConfig: tauriConfig.version,
  cargoToml: cargoVersionMatch[1],
};

const uniqueVersions = [...new Set(Object.values(versions))];
if (uniqueVersions.length !== 1) {
  fail(
    [
      'Version mismatch detected across release surfaces:',
      `- package.json: ${versions.packageJson}`,
      `- src-tauri/tauri.conf.json: ${versions.tauriConfig}`,
      `- src-tauri/Cargo.toml: ${versions.cargoToml}`,
    ].join('\n')
  );
}

const version = uniqueVersions[0];
const refName = process.env.GITHUB_REF_NAME || '';
const isTag = (process.env.GITHUB_REF || '').startsWith('refs/tags/');

if (isTag && refName.length > 0) {
  const expected = refName.startsWith('v') ? refName.slice(1) : refName;
  if (version !== expected) {
    fail(`Tag/version mismatch: tag=${refName}, code version=${version}`);
  }
}

console.log(`Version sync check passed (${version}).`);
