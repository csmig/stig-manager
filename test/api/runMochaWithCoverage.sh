

export STIGMAN_API_PORT=64001
export STIGMAN_DB_HOST=localhost
export STIGMAN_DB_PORT=50001
export STIGMAN_DB_PASSWORD=stigman
export STIGMAN_API_AUTHORITY="http://127.0.0.1:8080/realms/stigman"
export STIGMAN_SWAGGER_ENABLED=true
export STIGMAN_SWAGGER_SERVER="http://localhost:64001/api"
export STIGMAN_SWAGGER_REDIRECT="http://localhost:64001/api-docs/oauth2-redirect.html"
export STIGMAN_DEV_RESPONSE_VALIDATION=logOnly
export STIGMAN_EXPERIMENTAL_APPDATA=true
export NODE_V8_COVERAGE="$(pwd)/coverage"

mkdir -p $NODE_V8_COVERAGE

cd ../../
cd  ./api/source
npm ci --include=dev
cd ../../
cd ./test/api
npm ci --include=dev
cd ../../
echo "Make sure stigmanager api is not already running..."
kill -9 $(lsof -t -i:$STIGMAN_API_PORT)
echo "Running API and tests with coverage..."
c8 --reporter=html --reporter=text --reporter=lcov node -e "
  const { spawn } = require('child_process');
  
  console.log('Starting the API...');
  const server = spawn('node', ['./api/source/index.js'], { stdio: 'inherit' });

  // Wait for the API to start
  setTimeout(() => {
    console.log('Running Mocha tests...');
    const tests = spawn('mocha', ['*/**/*.test.js', '--no-timeouts', '--ignore', '*/**/node_modules/**/*', '--recursive', '--ignore', './node_modules/**'], { stdio: 'inherit' });

    tests.on('close', (code) => {
      console.log('Tests finished. Stopping server...');
      server.kill();
      process.exit(code);
    });
  }, 10000); // Adjust startup time as needed
"

c8 report -r lcov -r text -r html --report-dir ./test/api/coverage

echo "Coverage report is available at ./test/api/coverage"




