const path = require('path')


const xreactLoader = function(content) {
    const rootPath = path.resolve(__dirname, '..')
    const XReactPath = path.resolve(rootPath, 'src/xreact')
    const XReactDomPath = path.resolve(rootPath, 'src/xreact-dom')

    content = content.replace(`from 'xreact'`, `from '${XReactPath}'`)
    content = content.replace(`from "xreact"`, `from '${XReactPath}'`)
    content = content.replace(`from 'xreact-dom'`, `from '${XReactDomPath}'`)
    content = content.replace(`from "xreact-dom"`, `from '${XReactDomPath}'`)

    return content
}

module.exports = xreactLoader
