import { log } from './util'
import { stateChangeAdd, currentComponent, stateChangeComponentAdd } from './xreact-dom'

const createElement = function(tag, attrs, ...children) {
    attrs = attrs || {}
    const key = attrs.key
    return {
        tag,
        attrs,
        children,
        childNodes: [],
        key,
    }
}


export class Component {
    constructor(props = {}) {
        this.props = props
        this.state = {}
    }

    setState(stateChange) {
        stateChangeAdd(this, stateChange)
    }

    render() {
        return null
    }
}


export const useState = function(initialValue) {
    const component = currentComponent()
    const { states, stateIndex } = component._hooks
    let state = states[stateIndex]
    if (state === undefined) {
        states[stateIndex] = initialValue
        state = initialValue
    }

    const setState = (newValue) => {
        const oldValue = states[stateIndex]
        if (oldValue !== newValue) {
            component._dirty = true
            states[stateIndex] = newValue
            stateChangeComponentAdd(component)
        }
    }

    component._hooks.stateIndex += 1

    return [state, setState]
}

const depsChanged = function(oldDeps, newDeps) {
    return !oldDeps || !newDeps || oldDeps.length !== newDeps.length || newDeps.some((d, i) => d !== oldDeps[i])
}

export const useEffect = function(callback, deps) {
    const component = currentComponent()
    const { effects, effectIndex, pendingEffects } = component._hooks

    const effect = effects[effectIndex] || {}
    const { deps: oldDeps } = effect

    if (depsChanged(oldDeps, deps)) {
        effect.deps = deps
        effect.callback = callback
        pendingEffects.push(effect)
        effects[effectIndex] = effect
    }

    component._hooks.effectIndex += 1
}

export const useLayoutEffect = function(callback, deps) {
    const component = currentComponent()
    const { layoutEffects, layoutEffectIndex, pendingLayoutEffects } = component._hooks

    const effect = layoutEffects[layoutEffectIndex] || {}
    const { deps: oldDeps } = effect

    if (depsChanged(oldDeps, deps)) {
        effect.deps = deps
        effect.callback = callback
        pendingLayoutEffects.push(effect)
        layoutEffects[layoutEffectIndex] = effect
    }

    component._hooks.layoutEffectIndex += 1
}

export const useMemo = function(callback, deps) {
    const component = currentComponent()
    const { states, stateIndex } = component._hooks

    const [oldDeps, value] = states[stateIndex] || []

    let retVal = value

    if (depsChanged(oldDeps, deps)) {
        retVal = callback()
        states[stateIndex] = [deps, retVal]
    }

    component._hooks.stateIndex += 1

    return retVal
}

export const useCallback = function(callback, deps) {
    return useMemo(() => callback, deps)
}

const React = {
    createElement,
    Component,
}

export default React
