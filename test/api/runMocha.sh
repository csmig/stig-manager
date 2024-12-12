
#!/bin/bash

usage() {
  echo "Usage: $0 [-p pattern ...] [-f file ...] [-d directory ...] [-i iteration name ...]"
  echo "  -p pattern     Run tests matching the whole word."
  echo "  -f file        Run specific test file."
  echo "  -d directory   Run tests in specific directory."
  echo "  -i iteration   Run tests for specific iteration.name (see iterations.js)" 
  echo "  -c coverage    Run all tests and generate coverage report. (cannot be used with other options)"
  echo "  -b bail    Stop running tests after the first failure."
  echo -e "  -h help        examples: \n ./runMocha.sh \n ./runMocha.sh -p \"the name of my test\" \n ./runMocha.sh -p \"getCollections|getAsset\" \n ./runMocha.sh -p getCollections \n ./runMocha.sh -i lvl1 -i lvl2 -p getCollections \n ./runMocha.sh -f collectionGet.test.js \n ./runMocha.sh -d mocha/data/collection"
  exit 
}

DEFAULT_COMMAND="npx mocha --reporter mochawesome --no-timeouts --showFailed --exit --require ./setup.js './mocha/**/*.test.js'"
COMMAND="npx mocha --reporter mochawesome --no-timeouts --showFailed --exit --require ./setup.js"
COVERAGE=false
PATTERNS=()
FILES=()
DIRECTORIES=()
USERS=()

while getopts "cbp:f:d:i:h:" opt; do
  case ${opt} in
    b)
      COMMAND+=" --bail"
      ;;
    c)
      COVERAGE=true
      ;;
    p)
      PATTERNS+=("${OPTARG}")
      ;;
    f)
      FILES+=("./mocha/**/${OPTARG}")
      ;;
    d)
      DIRECTORIES+=("${OPTARG}")
      ;;
    i)
      USERS+=("${OPTARG}")
      ;;
    h)
      usage
      ;;
    *)
      usage
      ;;
  esac
done

if [ ${#FILES[@]} -gt 0 ] && [ ${#DIRECTORIES[@]} -gt 0 ]; then
  echo "Error: You can specify either files or directories, but not both."
  usage
fi

if [ ${#DIRECTORIES[@]} -gt 0 ]; then
  COMMAND+=" ${DIRECTORIES[*]}"
elif [ ${#FILES[@]} -gt 0 ]; then
  COMMAND+=" ${FILES[*]}"
else
  COMMAND+=" './mocha/**/*.test.js'"
fi

GREP_PATTERN=""
if [ ${#USERS[@]} -gt 0 ]; then
  USER_PATTERN=$(IFS='|'; echo "${USERS[*]}")
  GREP_PATTERN="\\biteration:(${USER_PATTERN})\\b"
fi

if [ ${#PATTERNS[@]} -gt 0 ]; then
  PATTERN_STRING=$(IFS='|'; echo "${PATTERNS[*]}")
  GREP_PATTERN="${GREP_PATTERN:+$GREP_PATTERN.*}\\b(${PATTERN_STRING})\\b"
fi

if [ -n "$GREP_PATTERN" ]; then
  COMMAND+=" -g \"/$GREP_PATTERN/\""
fi

if [ ${#PATTERNS[@]} -eq 0 ] && [ ${#FILES[@]} -eq 0 ] && [ ${#DIRECTORIES[@]} -eq 0 ] && [ ${#USERS[@]} -eq 0 ]; then
  COMMAND="$DEFAULT_COMMAND"
fi

if $COVERAGE; then

  SCRIPT_DIR=$(dirname "$(readlink -f "$0")")
  API_DIR="$SCRIPT_DIR/../../api/source"
  PROJECT_DIR="$SCRIPT_DIR/../.."
  COVERAGE_DIR="$SCRIPT_DIR/coverage"
  
  export STIGMAN_API_PORT=${STIGMAN_API_PORT:-64001}
  export STIGMAN_DB_HOST=${STIGMAN_DB_HOST:-localhost}
  export STIGMAN_DB_PORT=${STIGMAN_DB_PORT:-50001}
  export STIGMAN_DB_PASSWORD=${STIGMAN_DB_PASSWORD:-stigman}
  export STIGMAN_API_AUTHORITY=${STIGMAN_API_AUTHORITY:-"http://127.0.0.1:8080/realms/stigman"}
  export STIGMAN_EXPERIMENTAL_APPDATA=${STIGMAN_EXPERIMENTAL_APPDATA:-true}
  export NODE_V8_COVERAGE="$COVERAGE_DIR"

  mkdir -p "$NODE_V8_COVERAGE"
  cd "$PROJECT_DIR"

  echo "Make sure stigmanager api is not already running..."
  kill -9 $(lsof -t -i:${STIGMAN_API_PORT:-64001}) 2>/dev/null || echo "No existing API process found."
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

  c8 report -r lcov -r text -r html --report-dir "$COVERAGE_DIR"
  echo "Coverage report is available at $COVERAGE_DIR"
else
  echo "Running command: $COMMAND"
  eval $COMMAND
fi