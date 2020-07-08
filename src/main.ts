import { PageParsers } from "./parsers"
import { fetchMainContent } from "./utils"
import { Serializers } from "./serialization"
import { PageObj } from "./types"
import { writeFile, ensureDir } from "fs-extra"
import { join as joinPaths, dirname } from "path"

type BackupType = keyof typeof PageParsers
const AllBackupTypes = Object.keys(PageParsers) as BackupType[]

type SerializerName = keyof typeof Serializers

/**
 * url: `/<type>/<id>`
 */
const TypeUrlParts: { [type in BackupType]: string } = {
    article: "t",
    user: "member",
    category: "n",
}

const Cookie = process.env.COOKIE
const headers = Cookie ? { Cookie } : undefined

type PipeFn = (obj: PageObj) => PageObj | Promise<PageObj>

type FileNameFn = (obj?: PageObj, id?: number, fileExt?: string) => string | Promise<string>

interface Options {
    baseURL: string;
    outputDir: string;
    serializer?: SerializerName;
    types?: BackupType[];
    startId?: number;
    maxId?: number;
    /** 最大并发数 */
    maxConcurrent?: number;
}

class BackupHelper {

    private opts: Options;

    private pipeFnList: PipeFn[] = [];

    private fileNameFn?: FileNameFn;

    constructor(opts: Options) {
        this.opts = opts
    }

    /**
     * 设置输出的文件名为函数的返回值  
     * 否则为 `${id}.${fileExt}` 格式  
     * 函数在解析页面之后，pipeFn 之前运行
     */
    setFileNameFn(fn: FileNameFn) {
        this.fileNameFn = fn
        return this
    }

    /**
     * 在获取文件名(如果有)和序列化之间运行，修改 pageObj  
     * 可以添加多个，顺序运行
     */
    pipe(fn: PipeFn) {
        this.pipeFnList.push(fn)
        return this
    }

    async start() {

        const {
            baseURL,
            outputDir,
            serializer = "json",
            types = AllBackupTypes,
            startId = 1,
            maxId = Infinity,
            maxConcurrent = 20,
        } = this.opts

        const serializerFn = Serializers[serializer].serialize

        /** 文件扩展名 (不含`.`) */
        const fileExt = Serializers[serializer].EXT || serializer

        for (const type of types) {
            const urlpart = TypeUrlParts[type]
            const parser = PageParsers[type]

            let clist = []

            for (let id = startId; id <= maxId; id++) {
                const url = `${baseURL}/${urlpart}/${id}`

                clist.push(async () => {
                    console.log(url, "processing")

                    try {
                        const r = await fetchMainContent(url, {
                            timeout: 5 * 1000,
                            headers: headers,
                        })
                        let pageObj = await parser.parse(r)

                        for (const pipeFn of this.pipeFnList) {
                            if (pipeFn && typeof pipeFn == "function") {
                                pageObj = await pipeFn(pageObj)
                            }
                        }

                        const output = serializerFn(pageObj)

                        let fileName = `${id}.${fileExt}`
                        if (this.fileNameFn && typeof this.fileNameFn == "function") {
                            fileName = await this.fileNameFn(pageObj, id, fileExt)
                        }
                        const outputPath = joinPaths(outputDir, type, fileName)

                        await ensureDir(dirname(outputPath))
                        await writeFile(outputPath, output)

                        console.log(url, "finished")

                    } catch (err) {
                        if (err.message && err.message == "no more pages") {
                            console.error(url, "not found")
                            return true
                        } else {
                            console.error(url, err)
                        }
                    }
                })

                if (clist.length >= maxConcurrent) {
                    const results = await Promise.all(clist.map(f => f()))
                    clist = []

                    const ends = results.some((x) => x)
                    if (ends) {
                        break
                    }
                }

            }

            if (clist.length > 0) {
                await Promise.all(clist.map(f => f()))
            }
        }
    }

}

export = BackupHelper
