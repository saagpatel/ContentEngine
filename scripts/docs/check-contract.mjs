import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const CONTRACT_PATH = 'openapi/openapi.generated.json';
const REQUIRED_PATHS = [
  '/commands/save_content',
  '/commands/fetch_url',
  '/commands/repurpose_content',
  '/commands/get_history',
  '/commands/get_history_detail',
  '/commands/delete_history_item',
  '/commands/export_pdf',
  '/commands/get_usage_info',
  '/commands/get_api_key',
  '/commands/set_api_key',
  '/commands/get_brand_voices',
  '/commands/analyze_brand_voice',
  '/commands/delete_brand_voice',
  '/commands/set_default_voice',
];

const REQUIRED_SCHEMAS = [
  'SaveContentRequest',
  'ContentInput',
  'FetchedContent',
  'RepurposeEnvelope',
  'RepurposeResponse',
  'HistoryPage',
  'HistoryDetail',
  'UsageInfo',
  'BrandVoiceProfile',
  'ErrorMessage',
];

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

let beforeGenerate = '';
try {
  beforeGenerate = readFileSync(CONTRACT_PATH, 'utf8');
} catch {
  beforeGenerate = '';
}

execSync('node scripts/docs/generate-contract.mjs', { stdio: 'inherit' });

let afterGenerate = '';
try {
  afterGenerate = readFileSync(CONTRACT_PATH, 'utf8');
} catch (error) {
  fail(`Unable to read ${CONTRACT_PATH} after generation: ${error}`);
}

if (beforeGenerate !== afterGenerate) {
  fail(
    `Contract artifact is out of date. Run \`pnpm docs:generate\` and re-run \`pnpm docs:check\`.`
  );
}

let parsed;
try {
  parsed = JSON.parse(readFileSync(CONTRACT_PATH, 'utf8'));
} catch (error) {
  fail(`Failed to parse ${CONTRACT_PATH}: ${error}`);
}

if (parsed.openapi !== '3.1.0') {
  fail(`Expected openapi version 3.1.0 but received: ${parsed.openapi}`);
}

if (!parsed.paths || typeof parsed.paths !== 'object') {
  fail('Contract paths are missing or invalid.');
}

const missingPaths = REQUIRED_PATHS.filter((path) => !parsed.paths[path]);
if (missingPaths.length > 0) {
  fail(`Contract is missing required command paths: ${missingPaths.join(', ')}`);
}

const schemas = parsed.components?.schemas;
if (!schemas || typeof schemas !== 'object') {
  fail('Contract schemas are missing or invalid.');
}

const missingSchemas = REQUIRED_SCHEMAS.filter((name) => !schemas[name]);
if (missingSchemas.length > 0) {
  fail(`Contract is missing required schemas: ${missingSchemas.join(', ')}`);
}

console.log('Contract checks passed.');
