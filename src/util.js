export const log = console.log.bind(console)

export const isString = s => typeof s === 'string'
export const isNumber = s => typeof s === 'number'
export const isBoolean = s => typeof s === 'boolean'
export const isArray = a => Object.prototype.toString.call(a) === '[object Array]'
export const isObject = o => Object.prototype.toString.call(o) === '[object Object]'
export const isFunction = f => Object.prototype.toString.call(f) === '[object Function]'

export const isNil = x => x === undefined || x === null

export const isUpperCase = function(c) {
    return c >= 'A' && c <= 'Z'
}

export const toHypenFromCamelCase = function(camelCaseString) {
    let s = ''
    for (let i = 0; i < camelCaseString.length; i++) {
        const c = camelCaseString[i]
        if (isUpperCase(c)) {
            s += '-' + c.toLowerCase()
        } else {
            s += c
        }
    }
    return s
}

export const arrayFromSet = function(s) {
    const a = []
    for (let x of s) {
        a.push(x)
    }
    return a
}
