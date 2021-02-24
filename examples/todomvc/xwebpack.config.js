const path = require('path')
const HtmlXWebpackPlugin = require('xwebpack/plugins/html-xwebpack-plugin')

module.exports = {
    entry:  './src/index.js',
    output: {
        filename: "bundle.[contenthash].js",
        path: path.resolve(__dirname, 'dist'),
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader',
                ],
            },
            {
                test: /\.js$/,
                use: [
                    path.resolve(__dirname, '..', 'xreact-loader'),
                ],
            },
        ]
    },
    plugins: [
        new HtmlXWebpackPlugin({
            filename: 'index.html',
            template: path.resolve(__dirname, 'public/index.template.html'),
        }),
    ],
}
