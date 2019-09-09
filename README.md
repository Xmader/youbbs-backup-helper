
# youbbs-backup-helper

[![version](https://img.shields.io/github/package-json/v/Xmader/youbbs-backup-helper)](https://www.npmjs.com/package/youbbs-backup-helper) ![License MIT](https://img.shields.io/github/license/Xmader/youbbs-backup-helper) ![TypeScript type definitions](https://img.shields.io/badge/types-TypeScript-blue)


> 轻松备份 youBBS 站点, 不需要管理员或数据库访问权限

## Installation

```sh
npm install -g youbbs-backup-helper
```

## Usage

### CLI

```
youbbs-backup-helper \
    --base-url=https://www.youbbs.org \
    --output-dir=dist \
    --types=article user category \
    --start-id=1 \
    --max-id=Infinity \
    --serializer=markdown \
    --max-concurrent=50
```

[查看帮助](cli/cli.js#L7)

```bash
youbbs-backup-helper --help
```

### API

```js
const youbbsBackupHelper = require("youbbs-backup-helper")

new youbbsBackupHelper({
    baseURL: "https://www.youbbs.org",
    outputDir: "dist",
    types: ["article", "user", "category"],
    startId: 1,
    maxId: Infinity,
    serializer: "markdown",
    maxConcurrent: 50,
}).start()
```

[详细 API](src/main.ts#L37)

## License

MIT
