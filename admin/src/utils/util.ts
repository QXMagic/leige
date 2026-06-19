import { isObject } from '@vue/shared'
import { cloneDeep } from 'lodash'

/**
 * @description 添加单位
 * @param {String | Number} value 值 100
 * @param {String} unit 单位 px em rem
 */
export const addUnit = (value: string | number, unit = 'px') => {
    return !Object.is(Number(value), NaN) ? `${value}${unit}` : value
}

/**
 * @description 添加单位
 * @param {unknown} value
 * @return {Boolean}
 */
export const isEmpty = (value: unknown) => {
    return value == null && typeof value == 'undefined'
}

/**
 * @description 树转数组，队列实现广度优先遍历
 * @param {Array} data  数据
 * @param {Object} props `{ children: 'children' }`
 */

export const treeToArray = (data: any[], props = { children: 'children' }) => {
    data = cloneDeep(data)
    const { children } = props
    const newData = []
    const queue: any[] = []
    data.forEach((child: any) => queue.push(child))
    while (queue.length) {
        const item: any = queue.shift()
        if (item[children]) {
            item[children].forEach((child: any) => queue.push(child))
            delete item[children]
        }
        newData.push(item)
    }
    return newData
}

/**
 * @description 数组转
 * @param {Array} data  数据
 * @param {Object} props `{ parent: 'pid', children: 'children' }`
 */

export const arrayToTree = (
    data: any[],
    props = { id: 'id', parentId: 'pid', children: 'children' }
) => {
    data = cloneDeep(data)
    const { id, parentId, children } = props
    const result: any[] = []
    const map = new Map()
    data.forEach((item) => {
        map.set(item[id], item)
        const parent = map.get(item[parentId])
        if (parent) {
            parent[children] = parent[children] ?? []
            parent[children].push(item)
        } else {
            result.push(item)
        }
    })
    return result
}

/**
 * @description 获取正确的路经
 * @param {String} path  数据
 */
export function getNormalPath(path: string) {
    if (path.length === 0 || !path || path == 'undefined') {
        return path
    }
    const newPath = path.replace('//', '/')
    const length = newPath.length
    if (newPath[length - 1] === '/') {
        return newPath.slice(0, length - 1)
    }
    return newPath
}

/**
 * @description对象格式化为Query语法
 * @param { Object } params
 * @return {string} Query语法
 */
export function objectToQuery(params: Record<string, any>): string {
    let query = ''
    for (const props of Object.keys(params)) {
        const value = params[props]
        const part = encodeURIComponent(props) + '='
        if (!isEmpty(value)) {
            if (isObject(value)) {
                for (const key of Object.keys(value)) {
                    if (!isEmpty(value[key])) {
                        const params = props + '[' + key + ']'
                        const subPart = encodeURIComponent(params) + '='
                        query += subPart + encodeURIComponent(value[key]) + '&'
                    }
                }
            } else {
                query += part + encodeURIComponent(value) + '&'
            }
        }
    }
    return query.slice(0, -1)
}

/**
 * @description 时间格式化
 * @param dateTime { number } 时间戳
 * @param fmt { string } 时间格式
 * @return { string }
 */
// yyyy:mm:dd|yyyy:mm|yyyy年mm月dd日|yyyy年mm月dd日 hh时MM分等,可自定义组合
export const timeFormat = (dateTime: number, fmt = 'yyyy-mm-dd') => {
    // 如果为null,则格式化当前时间
    if (!dateTime) {
        dateTime = Number(new Date())
    }
    // 如果dateTime长度为10或者13，则为秒和毫秒的时间戳，如果超过13位，则为其他的时间格式
    if (dateTime.toString().length == 10) {
        dateTime *= 1000
    }
    const date = new Date(dateTime)
    let ret
    const opt: any = {
        'y+': date.getFullYear().toString(), // 年
        'm+': (date.getMonth() + 1).toString(), // 月
        'd+': date.getDate().toString(), // 日
        'h+': date.getHours().toString(), // 时
        'M+': date.getMinutes().toString(), // 分
        's+': date.getSeconds().toString() // 秒
    }
    for (const k in opt) {
        ret = new RegExp('(' + k + ')').exec(fmt)
        if (ret) {
            fmt = fmt.replace(
                ret[1],
                ret[1].length == 1 ? opt[k] : opt[k].padStart(ret[1].length, '0')
            )
        }
    }
    return fmt
}

/**
 * @description 获取不重复的id
 * @param length { Number } id的长度
 * @return { String } id
 */
export const getNonDuplicateID = (length = 8) => {
    let idStr = Date.now().toString(36)
    idStr += Math.random().toString(36).substring(3, length)
    return idStr
}

/**
 * 计算颜色透明度减淡
 */
export const calcColor = (color: string, opacity: number): string => {
    // 规范化透明度值在 0 ~ 1 之间
    opacity = Math.min(1, Math.max(0, opacity))

    // 检查颜色是否是 hex 格式
    const isHex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
    const isRgb = /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/
    const isRgba = /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[0-9.]+\s*\)$/

    let r: number = 0,
        g: number = 0,
        b: number = 0

    if (isHex.test(color)) {
        // 如果是 hex 格式 (#ffffff 或 #fff)
        const hex = color.slice(1)

        // 如果是3位短格式，扩展为6位
        const fullHex =
            hex.length === 3
                ? hex
                      .split('')
                      .map((h) => h + h)
                      .join('')
                : hex

        // 转换为 RGB
        r = parseInt(fullHex.substring(0, 2), 16)
        g = parseInt(fullHex.substring(2, 4), 16)
        b = parseInt(fullHex.substring(4, 6), 16)
    } else if (isRgb.test(color)) {
        // 如果是 rgb 格式 (rgb(255, 255, 255))
        const rgbValues = color.match(/\d+/g)
        if (rgbValues) {
            r = parseInt(rgbValues[0])
            g = parseInt(rgbValues[1])
            b = parseInt(rgbValues[2])
        }
    } else if (isRgba.test(color)) {
        // 如果是 rgba 格式 (rgba(255, 255, 255, 1))
        const rgbaValues = color.match(/\d+(\.\d+)?/g)
        if (rgbaValues) {
            r = parseInt(rgbaValues[0])
            g = parseInt(rgbaValues[1])
            b = parseInt(rgbaValues[2])
        }
    } else {
        throw new Error('Unsupported color format')
    }

    // 返回转换后的 rgba 颜色值
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

/**
 * @description 加载图片获取宽高
 * @param {string} url 图片地址(支持远程 URL 或 dataURL)
 * @returns {Promise<{width:number,height:number}>} 解析为图片自然宽高
 */
export const getImageSize = (url: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
        if (!url) {
            reject(new Error('图片地址为空'))
            return
        }
        const img = new Image()
        // 跨域时不取像素，仅读取尺寸,加上 crossOrigin 防止部分 CDN 报错
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
        img.onerror = () => reject(new Error('图片加载失败'))
        img.src = url
    })
}

/**
 * @description 校验图片是否为正方形(允许少量像素误差,常见的 1024x1023 这类裁切误差不会被误判)
 * @param {string} url 图片地址
 * @param {number} tolerance 允许的宽高像素差,默认 2 像素
 * @returns {Promise<boolean>} true 表示是正方形
 */
export const isSquareImage = async (url: string, tolerance = 2): Promise<boolean> => {
    try {
        const { width, height } = await getImageSize(url)
        if (!width || !height) return false
        return Math.abs(width - height) <= tolerance
    } catch (e) {
        // 加载失败时不阻塞用户(由其他地方提示),按"非正方形"处理避免误放行
        return false
    }
}
