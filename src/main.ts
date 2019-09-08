import { PageParsers } from "./parsers"
import { fetchMainContent } from "./utils"
import { Serializers } from "./serialization"
import { writeFile, ensureDir } from "fs-extra"
import { join as jsonPaths } from "path"

type BackupType = keyof typeof PageParsers
const AllBackupTypes = Object.keys(PageParsers) as BackupType[]

/**
 * url: `/<type>/<id>`
 */
const TypeUrlParts: { [type in BackupType]: string } = {
    article: "t",
    user: "member",
    category: "n",
}

interface Options {
    baseURL: string;
    outputDir: string;
    serializer?: "json" | "yaml" | "markdown";
    types?: BackupType[];
    startId?: number;
    maxId?: number;
    /** 最大并发数 */
    maxConcurrent?: number;
}

export const main = async ({
    baseURL,
    outputDir,
    serializer = "json",
    types = AllBackupTypes,
    startId = 1,
    maxId = Infinity,
    maxConcurrent = 20,
}: Options) => {

    const serializerFn = Serializers[serializer].serialize

    /** 文件扩展名 (不含`.`) */
    const fileExt = Serializers[serializer].EXT || serializer

    for (const type of types) {
        const urlpart = TypeUrlParts[type]
        const parser = PageParsers[type]

        let clist = []

        for (let id = startId; id <= maxId; id++) {
            const url = `${baseURL}/${urlpart}/${id}`

            if (clist.length > maxConcurrent) {
                const results = await Promise.all(clist.map(f => f()))
                clist = []

                const ends = results.some((x) => x)
                if (ends) {
                    break
                }
            }

            clist.push(async () => {
                console.log(url, "processing")

                try {
                    const r = await fetchMainContent(url)
                    const pageObj = await parser.parse(r)

                    const output = serializerFn(pageObj)

                    await ensureDir(jsonPaths(outputDir, type))
                    await writeFile(jsonPaths(outputDir, type, `${id}.${fileExt}`), output)

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

        }

        await Promise.all(clist.map(f => f()))
    }
}

export default main
