const { spawn } = require('child_process');
const path = require('path');

// The project uses a single root with:
//   - Backend (Express) in src/
//   - Pre-built frontend in dist/ (served by Express)
// In development, we run the backend which serves everything.

const rootDir = __dirname;

console.log('----------------------------------------------------');
console.log('   Starting InspectAI Platform                      ');
console.log('----------------------------------------------------');

// Start Express Server (serves both API + frontend from dist/)
const serverProcess = spawn('node', ['src/index.js'], { 
  cwd: rootDir, 
  shell: true,
  stdio: ['inherit', 'pipe', 'pipe'],
  env: { ...process.env }
});

serverProcess.stdout.on('data', (data) => {
  console.log(`\x1b[36m[Server]\x1b[0m ${data.toString().trim()}`);
});

serverProcess.stderr.on('data', (data) => {
  console.error(`\x1b[31m[Server Error]\x1b[0m ${data.toString().trim()}`);
});

serverProcess.on('exit', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code);
});

// Clean up processes on exit
process.on('SIGINT', () => {
  console.log('\nShutting down InspectAI server...');
  serverProcess.kill();
  process.exit();
});
process.on('SIGTERM', () => {
  serverProcess.kill();
  process.exit();
});
