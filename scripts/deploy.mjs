import { execSync } from 'child_process';
import { publish } from 'gh-pages';

function getRepoName() {
  if (process.env.REPO_NAME) return process.env.REPO_NAME;
  try {
    const url = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();
    const match = url.match(/\/([^/]+?)(\.git)?$/);
    return match ? match[1] : 'demo';
  } catch {
    return 'demo';
  }
}

const repoName = getRepoName();
const base = `/${repoName}/`;
console.log(`Building with base: ${base}`);

process.env.VITE_BASE = base;
execSync('npm run build', { stdio: 'inherit', env: process.env });

publish('dist', { dotfiles: true }, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Deployed to https://aegis7702.github.io/${repoName}/`);
});
