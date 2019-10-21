
import { Parser, MainContentParser, User, Article, Comment, Tag, Category } from "./types"
import { parseTime, fetchDataURL } from "./utils"

const timeReg = /(\d{4}-\d{2}-\d{2})/
const userNoReg = /第(\d+)号会员/

const getUserNo = (str: string) => {
    return +str.match(userNoReg)[1]
}

const getTime = (str: string) => {
    const timeStr = str.match(timeReg)[1] + " 00:00"
    return parseTime(timeStr)
}

/**
 * link url: `/<type>/<id>`
 */
const getIdFromLink = (str: string, type: string) => {
    return +str.match(`/${type}/(\\d+)`)[1]
}

const removeLinkTimeDots = (element: Element) => {
    element.querySelectorAll(".badge-notification").forEach((e) => {
        e.remove()
    })
}

export const UserPageParser: MainContentParser<User> = {
    async parse(mainContentElement): Promise<User> {

        const detailDiv = mainContentElement.querySelector(".member-detail")
        const [nameDiv, , urlDiv, aboutDiv] = detailDiv.children

        const mStr = nameDiv.childNodes[2].textContent
        const userID = getUserNo(mStr)
        const regTime = getTime(mStr)

        const userName = nameDiv.querySelector("strong").textContent

        const url = urlDiv.querySelector("a").text || null

        const about = aboutDiv.childNodes[2].textContent.trim() || null

        const avatarUrl = (mainContentElement.querySelector(".member-avatar > img") as HTMLImageElement).src

        const baseURLL: HTMLLinkElement = (mainContentElement.getRootNode() as Document).querySelector("link[rel=canonical]")
        const baseURL = baseURLL.href.replace(/\/+$/, "")
        const avatarDataUrl = await fetchDataURL(baseURL + avatarUrl)

        return {
            userID,
            userName,
            regTime,
            avatar: avatarDataUrl,
            url,
            about,
        }
    }
}

export const CommentParser: Parser<Comment> = {
    parse(commentItemDiv: Element): Comment {

        const contentDiv = commentItemDiv.querySelector(".commont-content")  // 没错就是 commont, youBBS 的源码中有 typo
        removeLinkTimeDots(contentDiv)
        const content = contentDiv.innerHTML.trim()

        const metaDiv = commentItemDiv.querySelector(".commont-data-date > .float-left")

        const authorDiv = metaDiv.querySelector("a")
        const authorID = getIdFromLink(authorDiv.href, "member")

        const addTime = getTime(metaDiv.textContent)

        return {
            authorID,
            addTime,
            content,
        }
    }
}

export const ArticlePageParser: MainContentParser<Article> = {
    parse(mainContentElement): Article {

        const document = mainContentElement.getRootNode() as Document

        // 获取 Article id, 取巧的方法，不保证长期可用
        // 这个 <script> 标签中脚本的作用是追踪链接点击数，会向这个文章的 url 发送一个 POST 请求 
        const linkclickCbScript = [...mainContentElement.querySelectorAll("script")].slice(-1)[0]
        const aid = getIdFromLink(linkclickCbScript.text, "t")

        const categoryA: HTMLAnchorElement = mainContentElement.querySelector(".fs14 > a:nth-child(2)")
        const cid = getIdFromLink(categoryA.href, "n")
        // const cName = categoryA.text

        const titleH1: HTMLHeadingElement = mainContentElement.querySelector(".topic-title-main > h1")
        const title = titleH1.textContent

        const metaDiv = mainContentElement.querySelector(".topic-title-date")
        const authorID = getIdFromLink(metaDiv.innerHTML, "member")
        const addTime = getTime(metaDiv.innerHTML)

        const contentContainer = mainContentElement.querySelector(".topic-content")
        const cDiv = contentContainer.querySelector(".c")
        const tagsDiv = contentContainer.querySelector(".mytag")

        const contentContainerChildren = [...contentContainer.children]
        const contentNextDivIndex = tagsDiv ? contentContainerChildren.indexOf(tagsDiv) : contentContainerChildren.indexOf(cDiv)

        const contentDivs = contentContainerChildren.slice(0, contentNextDivIndex)
        const content = contentDivs.map((div) => {
            removeLinkTimeDots(div)
            return div.outerHTML
        }).join("\n")

        const keywords = (document.querySelector("meta[name=keywords]") as HTMLMetaElement).content
        const tags: Tag[] = keywords ? keywords.split(",") : []

        const commentItemDivList = mainContentElement.querySelectorAll(".main-box > .commont-item")

        const comments: Comment[] = (
            [...commentItemDivList].map((commentItemDiv) => {
                return CommentParser.parse(commentItemDiv) as Comment
            })
        )

        return {
            aid,
            cid,
            authorID,
            addTime,
            title,
            content,
            tags,
            comments,
        }
    }
}

export const CategoryPageParser: MainContentParser<Category> = {
    parse(mainContentElement): Category {

        // TODO: 如果分类下面没有任何文章，则无法工作
        const firstCategoryA: HTMLAnchorElement = mainContentElement.querySelector(".item-date > a")
        const cid = getIdFromLink(firstCategoryA.href, "n")

        const document = mainContentElement.getRootNode() as Document
        const name = (document.querySelector("meta[name=keywords]") as HTMLMetaElement).content
        // const desc = document.querySelector("meta[name=description]").content

        // 获取分类描述，可能不存在
        const descP: Element | null = mainContentElement.querySelector(".post-list.grey > p")
        const desc: string | null = descP && descP.textContent

        return {
            cid,
            name,
            description: desc,
        }
    }
}

export const PageParsers = {
    article: ArticlePageParser,
    user: UserPageParser,
    category: CategoryPageParser,
}

export default PageParsers
