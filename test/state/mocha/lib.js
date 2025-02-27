import { spawn } from 'node:child_process'
import * as readline from 'node:readline'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
const __dirname = dirname(fileURLToPath(import.meta.url))

export async function spawnApiWait (env) {
  return new Promise((resolve, reject) => {
    const api = spawn('node', [`${__dirname}/../../../api/source/index.js`], {env})
    
    api.on('error', (err) => {
      reject(err)
    })

    const rValue = {
      process: api,
      logRecords: []
    }

    const rl = readline.createInterface({
      input: api.stdout,
      crlfDelay: Infinity
    })

    rl.on('line', (line) => {
      const json = JSON.parse(line)
      rValue.logRecords.push(json)
      if (json.type === 'started') {
        resolve(rValue)
      }
    })

    api.on('close', () => {
      resolve(rValue)
    })
  })
}

export async function spawnApi (env) {
  return new Promise((resolve, reject) => {
    console.log(JSON.stringify(process.env))
    const api = spawn('/usr/local/bin/node', [`${__dirname}/../../../api/source/index.js`], {env})
    
    api.on('error', (err) => {
      reject(err)
    })

    const rValue = {
      process: api,
      logRecords: []
    }

    const rl = readline.createInterface({
      input: api.stdout,
      crlfDelay: Infinity
    })

    rl.on('line', (line) => {
      const json = JSON.parse(line)
      rValue.logRecords.push(json)
      if (json.type === 'listening') {
        resolve(rValue)
      }
    })

    api.on('close', () => {
      resolve(rValue)
    })
  })
}

export async function waitChildClose (child) {
  return new Promise((resolve, reject) => {
    if (child.exitCode) {
      resolve(child.exitCode)
    }
    child.on('close', (code) => {
      resolve(code)
    })
    child.on('error', (err) => {
      reject(err)
    })
  })
}

export async function simpleRequest(url, method) {
  const options = {
    method
  }
  const response = await fetch(url, options)
  const headers = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  })
  return {
    status: response.status,
    headers,
    body: await response.json().catch(() => ({}))
  }
}

export function spawnMySQL (tag = '8.0.41', port = '3306') {
  let readyCount = 0
  return new Promise((resolve, reject) => {
    const child = spawn('docker', [
      'run', '--rm',
      // '--name', 'test-mysql',
      '-p', `${port}:3306`,
      '-e', 'MYSQL_ROOT_PASSWORD=rootpw',
      '-e', 'MYSQL_DATABASE=stigman',
      '-e', 'MYSQL_USER=stigman',
      '-e', 'MYSQL_PASSWORD=stigman',
      `mysql:${tag}`
    ])
    child.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`EXIT: Command failed with code ${code}`))
      }
    })

    // child.on('close', (code) => {
    //   console.log(`CLOSE: child process exited with code ${code}`)
    // });

    
    child.on('error', (err) => {
      console.error('ERROR: Failed to start the command:', err);
      reject(err)
    });
    

    const rl = readline.createInterface({
      input: child.stderr,
      crlfDelay: Infinity
    })
    rl.on('line', (line) => {
      if (line.includes('mysqld: ready for connections')) {
        readyCount++
        if (readyCount === 2) {
          resolve(child)
        } 
      }
    })
  })
}

export function spawnMockKeycloak (port = '8080') {
  const child =  spawn('python3', ['-m', 'http.server', port], {cwd: `${__dirname}/../../api/mock-keycloak`})
  // child.on('exit', (code) => {
  //   console.log(`EXIT: Mock Keycloak server exited with code ${code}`);
  // })

  // child.on('close', (code) => {
  //   console.log(`CLOSE: Mock Keycloak server closed with code ${code}`)
  // });

  
  // child.on('error', (err) => {
  //   console.log('ERROR: Mock Keycloak server error:', err);
  // });

  // child.stdout.on('data', (data) => {
  //   console.log(`stdout: ${data}`)
  // })
  // child.stderr.on('data', (data) => {
  //   console.log(`stderr: ${data}`)
  // })


  // const rl = readline.createInterface({
  //   input: child.stdout,
  //   crlfDelay: Infinity
  // })
  // rl.on('line', (line) => {
  //   if (line.includes('Serving HTTP')) {
  //     resolve(child)
  //   }
  // })
  return child
}