
type Time = Date;

type HTML = string;


type UserID = number;

type UserName = string;

export interface User {
    /** 用户 id */
    userID: UserID;

    /** 用户名 */
    userName: UserName;

    /** 注册时间 */
    regTime: Time;

    /** 头像 Data URL */
    avatar: string;

    /** 用户资料中填写的网站 */
    url?: string;

    /** 用户描述 */
    about?: string;
}


export interface Comment {
    /** 作者 uid */
    authorID: UserID;

    /** 发表时间 */
    addTime: Time;

    /** 评论内容 */
    content: HTML;
}


type CategoryID = number;

export interface Category {
    /** 分类 id */
    cid: CategoryID;

    /** 分类名称 */
    name: string;

    /** 分类描述 */
    description?: string;
}


export type Tag = string;

type ArticleID = number;

export interface Article {
    /** 文章 id */
    aid: ArticleID;

    /** 分类 id */
    cid: CategoryID;

    /** 作者 uid */
    authorID: UserID;

    /** 发表时间 */
    addTime: Time;

    /** 标题 */
    title: string;

    /** 内容 */
    content: HTML;

    /** 标签列表 */
    tags: Tag[];

    /** 评论列表 */
    comments: Comment[];
}

export type PageObj = User | Article | Category

export interface Parser<T = any> {
    parse(element: Element): T | PromiseLike<T>;
}

export interface MainContentParser<T = any> extends Parser<T> {
    /**
     * @param mainContentElement <div class="main-content">
     */
    parse(mainContentElement: Element): T | PromiseLike<T>;
}
