const path = require('path')
const fs = require('fs')

module.exports = {
    up: async (pool) => {
      try {
        let migrationName = path.basename(__filename, '.js')
        console.log(`[DB] Running migration ${migrationName} UP`)
        let dir = path.join(__dirname, 'sql', migrationName, 'up')
        let files = await fs.promises.readdir(dir)
        await pool.connect()
        for (file of files) {
            console.log(`[DB] Running MSSQL script ${file}...`)
            const sql = fs.readFileSync(path.join(dir, file)).toString()
            const result = await pool.request().batch(sql)
        }

      }
      catch (e) {
        console.log(e)
      }
},
    down: async(pool)=> {
        let migrationName = path.basename(__filename, '.js')
        console.log(`[DB] Running migration ${migrationName} DOWN`)
        await pool.query(`DROP DATABASE IF EXISTS stigman`)
    }
}