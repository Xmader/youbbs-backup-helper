
import fetch, { RequestInfo, RequestInit, Blob } from "node-fetch"
import { JSDOM } from "jsdom"

const _getEnvSetTimeZone = () => {
    return process && process.env && process.env["YOUBBS_TIMEZONE"]
}

/**
 * 解析时间
 * @example
 * parseTime("2019-08-07 13:49") -> 
 * new Date("2019-08-07 13:49+08:00") ->
 * new Date("2019-08-07T05:49:00.000Z")
 */
export const parseTime = (timeStr: string, timeZone = _getEnvSetTimeZone() || "+08:00") => {
    return new Date(`${timeStr}${timeZone}`)
}

export const blobToDataUrl = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        try {
            const reader = new FileReader()
            reader.onload = () => {
                resolve(reader.result as string)
            }
            reader.readAsDataURL(blob)
        } catch (err) {
            reject(err)
        }
    })
}

export const bufferToDataUrl = (buffer: Buffer, mimeType: string) => {
    const data = buffer.toString("base64")
    return `data:${mimeType};base64,${data}`
}

export const fetchDataURL = async (url: RequestInfo, init?: RequestInit) => {
    const r = await fetch(url, init)
    const mime = r.headers.get("content-type")

    if (typeof process !== "undefined") {  // node js
        const data = await r.buffer()
        return bufferToDataUrl(data, mime)
    } else {  // browser
        const data = await r.blob()
        // @ts-ignore
        return blobToDataUrl(data)
    }
}

export class CrossDOMParser {
    parseFromString(html: string, type: SupportedType = "text/html"): Document {
        if (typeof DOMParser !== "undefined") {
            return new DOMParser().parseFromString(html, type)
        } else {
            const { document } = new JSDOM(html).window
            return document
        }
    }
}

export const fetchDOM = async (url: RequestInfo, init?: RequestInit) => {
    const r = await fetch(url, init)
    const html = await r.text()

    if (html == "key_not_found") {  // 页面不存在 (从未存在), 后续应该没有页面了
        throw Error("no more pages")
    }

    if (!r.ok) {  // 页面已被删除或没有权限访问
        // if (html == '{"retcode":404,"retmsg":"not found"}') {
        throw Error("page deleted")
        // }
    }

    const document = new CrossDOMParser().parseFromString(html)
    return document
}

export const fetchMainContent = async (url: RequestInfo, init?: RequestInit) => {
    const document = await fetchDOM(url, init)
    return document.querySelector(".main-content")
}
