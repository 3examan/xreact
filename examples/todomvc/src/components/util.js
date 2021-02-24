export const classnames = function(options) {
    const classes = []
    for (let [className, enabled] of Object.entries(options)) {
        if (enabled) {
            classes.push(className)
        }
    }
    return classes.join(' ')
}
