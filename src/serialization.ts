
import { PageObj, Category, User, Article } from "./types"
import YAML from "js-yaml"
import TurndownService from "turndown"

export interface Serializer {
    serialize(obj: PageObj): string;

    /** 文件扩展名 (不含`.`) */
    EXT?: string;
}

export const JsonSerializer: Serializer = {
    serialize(obj: PageObj) {
        return JSON.stringify(obj)
    }
}

export const YamlSerializer: Serializer = {
    serialize(obj: PageObj) {
        return YAML.safeDump(obj)
    }
}


const turndownService = new TurndownService({
    defaultReplacement(innerHTML, node) {
        // @ts-ignore
        return node.isBlock ? "\n\n" + node.outerHTML + "\n\n" : node.outerHTML
    },
    blankReplacement(innerHTML, node: HTMLElement) {
        if (
            node.nodeName === "DIV" &&
            node.classList.contains("videowrapper")
        ) {
            return node.outerHTML
        }

        return ""
    },
})

/**
 * 生成 YAML 头信息
 */
const createYAMLHeader = (obj: object) => {
    return (
        "---\n" +
        YAML.safeDump(obj, { indent: 4 }) +
        "---\n"
    )
}

export const MarkdownSerializer: Serializer = {
    EXT: "md",
    serialize(obj: PageObj) {
        const content = (obj as Article).content
            || (obj as User).about
            || (obj as Category).description

        delete (obj as Article).content
        delete (obj as User).about
        delete (obj as Category).description

        // 将评论内容转为 markdown
        if ((obj as Article).comments) {
            (obj as Article).comments.forEach((c) => {
                c.content = turndownService.turndown(c.content)
            })
        }

        const header = createYAMLHeader(obj)

        const md = content ? turndownService.turndown(content) : ""

        return header + "\n" + md + "\n"
    }
}

export const Serializers = {
    json: JsonSerializer,
    yaml: YamlSerializer,
    markdown: MarkdownSerializer,
}
