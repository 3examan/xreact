import React from './xreact'
import { log, arrayFromSet, isNil, isString, isNumber, isBoolean, isArray, isObject, isFunction, toHypenFromCamelCase } from './util'


let __currentComponent = null

export const currentComponent = function() {
    return __currentComponent
}

export const setCurrentComponent = function(component) {
    __currentComponent = component
}

export const resetComponentHooksIndex = function(component) {
    if (component._hooks) {
        component._hooks.stateIndex = 0
        component._hooks.effectIndex = 0
        component._hooks.layoutEffectIndex = 0
    }
}

export const resetComponentHooksPendingEffects = function(component) {
    if (component._hooks) {
        component._hooks.pendingEffects = []
        component._hooks.pendingLayoutEffects = []
    }
}

const getNextOldDomNode = function(childNodes, currentIndex) {
    for (let i = currentIndex+1; i < childNodes.length; i++) {
        let node = childNodes[i]
        if (node) {
            return node
        }
    }
    return null
}

const render = function(vnode, container) {
    const element = renderVNode(container, vnode)

    if (container && element && element.parentNode !== container) {
        appendChild(container, element)
    }
    return element
}

const appendChild = function(container, element) {
    if (element) {
        container.appendChild(element)
    }
    return element
}

const insertBefore = function(container, newNode, oldNode) {
    if (container && newNode) {
        if (oldNode) {
            container.insertBefore(newNode, oldNode)
        } else {
            container.appendChild(newNode)
        }
    }
    return newNode
}

const replaceChild = function(element, newNode, oldNode) {
    let component = oldNode && oldNode._component
    if (component && component.componentWillUnmount) {
        component.componentWillUnmount()
    }

    cleanupEffects(component)

    element.replaceChild(newNode, oldNode)
}

const removeNode = function(dom) {
    if (!dom) {
        return
    }

    let component = dom && dom._component
    if (component && component.componentWillUnmount) {
        component.componentWillUnmount()
    }

    cleanupEffects(component)

    if (dom && dom.parentNode) {
        dom.parentNode.removeChild(dom)
    }
}

const isTrivalNode = function(vnode) {
    return (
            isNumber(vnode) ||
            isString(vnode)
    )
}


const isNilNode = function(vnode) {
    return (
            vnode === undefined ||
            vnode === null ||
            isBoolean(vnode)
    )
}

const renderVNode = function(container, vnode) {
    if (isNilNode(vnode)) {
        return null
    }

    if (isNumber(vnode)) {
        vnode = String(vnode)
    }

    let element

    if (isString(vnode)) {
        element = document.createTextNode(vnode)
        return element
    }

    if (isFunction(vnode.tag)) {
        const component = createComponent(vnode)
        component.container = container
        renderComponentWithProps(component, vnode.attrs)
        element = component.base
        return element
    }

    element = document.createElement(vnode.tag)

    for (let [k, v] of Object.entries(vnode.attrs)) {
        if (!k.startsWith('__')) {
            setAttribute(element, k, v)
        }
    }

    let children = normalizeChildren(vnode.children)
    let childNodes = vnode.childNodes
    for (let c of children) {
        let e = render(c, element)
        childNodes.push(e)
    }

    for (let i = 0; i < childNodes.length; i++) {
        let e = childNodes[i]
        if (e && e._component) {
            e._component.nextOldDomNode = getNextOldDomNode(childNodes, i)
        }
    }

    return element
}

const normalizeChildren = function(children) {
    if (isArray(children[0])) {
        return normalizeChildren(children[0])
    } else {
        return children
    }
}

const updateDom = function(container, oldDomNode, oldVNode, newVNode, nextOldDomNode) {
    // new add
    if (isNilNode(oldVNode)) {
        if (!isNilNode(newVNode)) {
            const element = renderVNode(container, newVNode)
            if (nextOldDomNode) {
                insertBefore(container, element, nextOldDomNode)
            } else {
                appendChild(container, element)
            }
            return element
        } else {
            // nothing changed
        }

        return null
    }

    // remove
    if (isNilNode(newVNode)) {
        if (oldDomNode) {
            removeNode(oldDomNode)
        }
        return null
    }

    // trival node changed
    if (isTrivalNode(oldVNode) || isTrivalNode(newVNode)) {
        if (oldVNode !== newVNode) {
            const element = renderVNode(container, newVNode)
            replaceChild(container, element, oldDomNode)
            return element
        }
        return oldDomNode
    }

    // node type changed
    if (oldVNode.tag !== newVNode.tag) {
        const element = renderVNode(container, newVNode)
        replaceChild(container, element, oldDomNode)
        return element
    }

    if (isFunction(newVNode.tag)) {
        return updateComponent(oldDomNode, newVNode)
    }

    // same node type, check props and children
    updateProps(oldDomNode, oldVNode, newVNode)

    const oldVChilds = oldVNode.children
    const newVChilds = newVNode.children
    const newChildNodes = updateChildren(oldDomNode, oldVNode.childNodes, oldVChilds, newVChilds)
    newVNode.childNodes = newChildNodes

    return oldDomNode
}

const updateProps = function(element, oldVNode, newVNode) {
    const oldAttrs = {}
    const newAttrs = {}

    for (let name in oldVNode.attrs) {
        if (!name.startsWith('__')) {
            oldAttrs[name] = oldVNode.attrs[name]
        }
    }

    for (let name in newVNode.attrs) {
        if (!name.startsWith('__')) {
            newAttrs[name] = newVNode.attrs[name]
        }
    }

    for (let name in oldAttrs) {
        if (!(name in newAttrs)) {
            removeAttribute(element, name)
        }
    }

    for (let name in newAttrs) {
        if (oldAttrs[name] !== newAttrs[name]) {
            setAttribute(element, name, newAttrs[name])
        }
    }
}

const updateChildren = function(container, oldChildNodes, oldVChilds, newVChilds) {
    let isList = isArray(newVChilds[0])

    if (isList) {
        return updateChildrenWithKey(container, oldChildNodes, oldVChilds, newVChilds)
    } else {
        return updateChildrenWithoutKey(container, oldChildNodes, oldVChilds, newVChilds)
    }
}

const updateChildrenWithKey = function(container, oldChildNodes, oldVChilds, newVChilds) {
    oldVChilds = normalizeChildren(oldVChilds)
    newVChilds = normalizeChildren(newVChilds)

    // index old childs
    const oldKeyedVChildMapper = {}
    const oldVChildsWithoutKey = []
    for (let i = 0; i < oldVChilds.length; i++) {
        const vnode = oldVChilds[i]
        const element = oldChildNodes[i]
        if (!isNil(vnode.key)) {
            oldKeyedVChildMapper[vnode.key] = { element, vnode, index: i }
        } else {
            oldVChildsWithoutKey.push({ element, vnode, index: i })
        }
    }

    // index new childs
    const newKeyedVChildMapper = {}
    const newVChildsWithKey = []
    const newVChildsWithoutKey = []
    for (let i = 0; i < newVChilds.length; i++) {
        const c = newVChilds[i]
        if (!isNil(c.key)) {
            newVChildsWithKey.push({ vnode: c, index: i })
            newKeyedVChildMapper[c.key] = { vnode: c, index: i }
        } else {
            newVChildsWithoutKey.push(c)
        }
    }

    // update childs
    const newChildNodes = []
    const needInsertNodes = []
    let lastIndex = 0
    for (let item of newVChildsWithKey) {
        let { vnode: newVNode, index: newIndex } = item
        if (newVNode.key in oldKeyedVChildMapper) {
            let nextElement = getNextOldDomNode(oldChildNodes, lastIndex)
            let { vnode: oldVNode, index: oldIndex, element } = oldKeyedVChildMapper[newVNode.key]
            let newElement = updateDom(container, element, oldVNode, newVNode, nextElement)
            oldChildNodes[oldIndex] = newElement
            if (oldIndex < lastIndex) {
                insertBefore(container, newElement, nextElement)
            }
            newChildNodes.push(newElement)
            needInsertNodes.push(null)
            lastIndex = Math.max(oldIndex, lastIndex)
        } else {
            // collect new nodes
            const newElement = renderVNode(container, newVNode)
            newChildNodes.push(newElement)
            needInsertNodes.push(newElement)
        }
    }

    // insert new nodes
    needInsertNodes.forEach((newElement, index) => {
        if (newElement) {
            let nextElement = null
            for (let i = index+1; i < newChildNodes.length; i++) {
                let node = newChildNodes[i]
                let vnode = newVChilds[i]
                if (node && vnode.key in oldKeyedVChildMapper) {
                    nextElement = node
                    break
                }
            }
            insertBefore(container, newElement, nextElement)
        }
    })

    // remove key not in newVChildsWithKey
    for (let [key, { element }] of Object.entries(oldKeyedVChildMapper)) {
        if (!(key in newKeyedVChildMapper)) {
            removeNode(element)
        }
    }

    return newChildNodes
}

const updateChildrenWithoutKey = function(container, oldChildNodes, oldVChilds, newVChilds) {
    oldVChilds = normalizeChildren(oldVChilds)
    newVChilds = normalizeChildren(newVChilds)

    const newChildNodes = []

    // replace childs
    for (let i = 0; i < newVChilds.length; i++) {
        let oldVNode = oldVChilds[i]
        let newVNode = newVChilds[i]
        let element = oldChildNodes[i]
        let nextOldDomNode = getNextOldDomNode(oldChildNodes, i)
        if (element && element._component) {
            element._component.nextOldDomNode = nextOldDomNode
        }
        let newDomNode = updateDom(container, element, oldVNode, newVNode, nextOldDomNode)
        newChildNodes.push(newDomNode)
    }

    // remove childs
    for (let i = newVChilds.length; i < oldVChilds.length; i++) {
        removeNode(oldChildNodes[i])
    }

    return newChildNodes
}


const unmountComponent = function(component) {
    if (component.componentWillUnmount) {
        component.componentWillUnmount()
    }
    if (component._hooks) {
        const { effects } = component._hooks
        for (let effect of effects) {
            if (isFunction(effect.cleanup)) {
                effect.cleanup()
            }
        }
    }
    removeNode(component.base)
}


const createComponent = function(vnode) {
    const component = vnode.tag
    const props = vnode.attrs
    if (!(component.prototype && component.prototype.render)) {
        const comp = new React.Component(props)
        comp.constructor = component
        comp._hooks = {
            stateIndex: 0,
            states: [],
            effectIndex: 0,
            effects: [],
            pendingEffects: [],
            layoutEffectIndex: 0,
            layoutEffects: [],
            pendingLayoutEffects: [],
        }
        comp.render = () => component(props)
        return comp
    } else {
        const comp = new component(props)
        return comp
    }
}


const renderComponentWithProps = function(component, props) {
    component.props = props
    return renderComponent(component)
}


const updateComponent = function(element, newVNode) {
    const component = element && element._component
    if (component && component.constructor === newVNode.tag) {
        renderComponentWithProps(component, newVNode.attrs)
        return component.base
    } else {
        if (component) {
            unmountComponent(component)
        }

        const newComponent = createComponent(newVNode)
        renderComponentWithProps(newComponent, newVNode.attrs)
        return newComponent.base
    }
}


export const renderComponent = function(component) {
    setCurrentComponent(component)
    resetComponentHooksIndex(component)
    resetComponentHooksPendingEffects(component)

    const newVNode = component.render()
    component._dirty = false
    updateLayoutEffects(component)
    if (component._dirty) {
        return renderComponent(component)
    }

    let base = updateDom(component.container, component.base, component.oldVNode, newVNode, component.nextOldDomNode)

    if (component.base) {
        if (component.componentDidUpdate) {
            component.componentDidUpdate()
        }
    } else if (component.componentDidMount) {
        component.base = base
        component.oldVNode = newVNode
        if (base) {
            base._component = component
        }
        component.componentDidMount()
    }

    component.base = base
    component.oldVNode = newVNode
    if (base) {
        base._component = component
    }

    updateEffects(component)

    return base
}


let _effectsComponents = []
const addEffectsComponent = function(component) {
    _effectsComponents.push(component)
}

const updateEffectsAfterPaint = function() {
    for (let component of _effectsComponents) {
        updateEffects(component)
    }
    _effectsComponents = []
}

const updateEffects = function(component) {
    return _updateEffects(component, 'pendingEffects')
}

const updateLayoutEffects = function(component) {
    return _updateEffects(component, 'pendingLayoutEffects')
}

const _updateEffects = function(component, effectType) {
    if (component._hooks) {
        const pendingEffects = component._hooks[effectType]
        // cleanup
        for (let effect of pendingEffects) {
            const { cleanup } = effect
            if (isFunction(cleanup)) {
                cleanup()
            }
        }
        // useEffect
        for (let effect of pendingEffects) {
            const { callback } = effect
            if (isFunction(callback)) {
                effect.cleanup = callback()
            }
        }
        component._hooks[effectType] = []
    }
}

const cleanupEffects = function(component) {
    if (component && component._hooks) {
        const { effects, layoutEffects } = component._hooks
        // cleanup effects
        for (let effect of effects) {
            if (isFunction(effect.cleanup)) {
                effect.cleanup()
            }
        }
        // cleanup layout effects
        for (let effect of layoutEffects) {
            if (isFunction(effect.cleanup)) {
                effect.cleanup()
            }
        }
    }
}


const removeAttribute = function(element, key) {
    if (key === 'className') {
        key = 'class'
    }
    if (key.startsWith('on')) {
        key = key.toLowerCase()
    }
    element.removeAttribute(key)
}

const setAttribute = function(element, key, value) {
    if (key === 'className') {
        key = 'class'
    }

    if (key.startsWith('on')) {
        let k = key.toLowerCase()
        if (k === 'ondoubleclick') {
            k = 'ondblclick'
        }
        if (k === 'onchange') {
            k = 'oninput'
        }
        element[k] = value
        return
    }
    else if (key === 'style') {
        if (isString(value)) {
            element[key] = value
            return
        } else if (isObject(value)) {
            const css = Object.entries(value).map(([k, v]) => `${toHypenFromCamelCase(k)}: ${v};`).join(' ')
            element[key] = css
            return
        }
    } else if (key in element) {
        element[key] = value
    } else {
        element.setAttribute(key, value)
    }
}


let stateChangeQueue = []
const stateChangeComponents = new Set()

export const stateChangeComponentAdd = function(component) {
    stateChangeComponents.add(component)
    defer(flush)
}

export const stateChangeAdd = function(component, stateChange) {
    if (stateChangeQueue.length === 0) {
        defer(flush)
    }
    stateChangeQueue.push({
        component,
        stateChange,
    })
    stateChangeComponents.add(component)
}

const flush = function() {
    const queue = stateChangeQueue
    stateChangeQueue = []
    for (let { component, stateChange } of queue) {
        if (!component.prevState) {
            component.prevState = component.state
        }
        if (isFunction(stateChange)) {
            Object.assign(component.state, stateChange(component.prevState, component.props))
        } else {
            Object.assign(component.state, stateChange)
        }
        component.prevState = component.state
    }
    const components = arrayFromSet(stateChangeComponents)
    stateChangeComponents.clear()
    for (let component of components) {
        renderComponent(component)
    }
}


const defer = function(fn) {
    requestAnimationFrame(fn)
}


const ReactDOM = {}

ReactDOM.render = function(vnode, container) {
    container.innerHTML = ''
    let e = render(vnode, container)
    return e
}


export default ReactDOM
