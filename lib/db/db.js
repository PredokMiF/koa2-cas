const _ = require('lodash')
const path = require('path')
const fse = require('fs-extra')
const fs = require('async-file')
const MD5 = require('md5')
const pgPromise = require('pg-promise')
const promise = require('bluebird')


module.exports = async function db({ cfg, logger }) {
    const initOptions = {
        promiseLib: promise
    }

    const pgp = pgPromise(initOptions);

    const db = pgp(cfg.db.cfg)

    // Test connection
    await db.any('select 1 + 1')

    let { schema, tablePrefix, dbUpdaterTaskDir, dbUpdaterTableName } = cfg.db
    dbUpdaterTableName = tablePrefix + dbUpdaterTableName

    await db.none(`CREATE SCHEMA IF NOT EXISTS \${schema:name};`, { schema })

    await db.none(`
        CREATE TABLE IF NOT EXISTS \${schema:name}.\${dbUpdaterTableName:name} (
            name character varying(256) NOT NULL,
            md5 character varying(128) NOT NULL,
            PRIMARY KEY (name)
        );
    `, { schema, dbUpdaterTableName })

    const tasksToExecute = await getTasksToExecute(db, { schema, dbUpdaterTaskDir, dbUpdaterTableName }, logger)

    for (let i = 0; i < tasksToExecute.length; i++) {
        const task = tasksToExecute[i]
        try {
            const { path, name, md5 } = task

            await require(path)(db, { schema, tablePrefix })
            await db.none('INSERT INTO ${schema:name}.${dbUpdaterTableName:name} (name, md5) VALUES (${name}, ${md5});', { schema, dbUpdaterTableName, name, md5 })

            logger.info(`Обновление из файла ${name} было успешно выполнено`, { util: 'DB_UPDATER' })
        } catch (e) {
            logger.error(`Обновление из файла ${task.name} завершилось с ошибкой`, e, Object.assign({ util: 'DB_UPDATER' }, task))
            throw e
        }
    }

    return db
}

async function getTasksToExecute(db, { schema, dbUpdaterTaskDir, dbUpdaterTableName }, logger) {
    await fse.ensureDir(dbUpdaterTaskDir)

    let tasksToExecute = await fs.readdir(dbUpdaterTaskDir)

    // Убираем все кроме файлов
    for (let i = tasksToExecute.length - 1; i >=0; i--) {
        const filePath = path.join(dbUpdaterTaskDir, tasksToExecute[i])
        const fileStat = await fs.stat(filePath)
        if (!fileStat.isFile()) {
            tasksToExecute[i] = undefined
        }
    }
    tasksToExecute = tasksToExecute.filter(t => t).sort()

    for (let i = 0; i < tasksToExecute.length; i++) {
        const filePath = path.join(dbUpdaterTaskDir, tasksToExecute[i])
        const fileContent = await fs.readFile(filePath, 'utf8')
        const md5 = MD5(fileContent)

        tasksToExecute[i] = {
            path: filePath,
            name: tasksToExecute[i],
            md5
        }
    }

    const executed = await db.manyOrNone(`SELECT name, md5 FROM \${schema:name}.\${dbUpdaterTableName:name}`, { schema, dbUpdaterTableName })
    const lostTasks = _.difference(executed.map(rec => rec.name), tasksToExecute.map(rec => rec.name))
    if (lostTasks.length) {
        logger.warn(`В базе выполнены обновления, которых сейчас нет: "${lostTasks.join('", "')}"`, { util: 'DB_UPDATER' })
    }
    const executedMap = executed.reduce((out, { name, md5 }) => {
        out[name] = md5
        return out
    }, {})

    const tasksToExecuteFinal = []
    for (let i = 0; i < tasksToExecute.length; i++) {
        const taskToExecute = tasksToExecute[i]
        if (executedMap[taskToExecute.name]) {
            if (taskToExecute.md5 !== executedMap[taskToExecute.name]) {
                logger.warn(`В базе выполнено обновление, но MD5 не совпадает`, {
                    util: 'DB_UPDATER',
                    taskName: taskToExecute.name,
                    executedMd5: executedMap[taskToExecute.name],
                    currentMd5: taskToExecute.md5
                })
            }
        } else {
            tasksToExecuteFinal.push(taskToExecute)
        }
    }

    return tasksToExecuteFinal
}
