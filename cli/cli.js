#!/usr/bin/env node
// @ts-check

const { Serializers } = require("../dist/serialization")
const { PageParsers } = require("../dist/parsers")

const argv = require("yargs").options({
    "base-url": {
        type: "string",
        demandOption: true,
        describe: "网站根 URL \ne.g. https://www.youbbs.org",
    },
    "output-dir": {
        type: "string",
        demandOption: true,
        normalize: true,
        describe: "备份文件输出路径",
    },
    "serializer": {
        type: "string",
        choices: Object.keys(Serializers),
        default: "json",
        describe: "输出的文件类型",
    },
    "types": {
        type: "array",
        choices: Object.keys(PageParsers),
        default: Object.keys(PageParsers),
        describe: "备份的类型 (多选)：\n备份 '文章'、'用户'、'分类'",
    },
    "start-id": {
        type: "number",
        default: 1,
        describe: "备份 id 范围下限 (含)",
    },
    "max-id": {
        type: "number",
        default: Infinity,
        describe: "备份 id 范围上限 (含)",
    },
    "max-concurrent": {
        type: "number",
        default: 20,
        describe: "最大并发数",
    }
}).argv

const BackupHelper = require("..")

new BackupHelper({
    baseURL: argv["base-url"],
    outputDir: argv["output-dir"],
    // @ts-ignore
    serializer: argv.serializer,
    // @ts-ignore
    types: argv.types,
    startId: argv["start-id"],
    maxId: argv["max-id"],
    maxConcurrent: argv["max-concurrent"],
}).start()
