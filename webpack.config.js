'use strict';

const path = require('path');
const autoprefixer= require('autoprefixer');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackPugPlugin = require('html-webpack-pug-plugin');
const webpack=require("webpack")

// Globally available examples: https://stackoverflow.com/questions/28969861/managing-jquery-plugin-dependency-in-webpack


module.exports = {
    mode: 'development',
    entry: {
        shared:{
            import: ["./src/js/main.js"],
            filename: "webpack.js",
        },
        "cookieconsent":{
            import:["cookieconsent","cookieconsent/build/cookieconsent.min.css"],
            filename: "cookieconsent.js"
        },
        /*"vue":{
            import:["vue/vue"],
            filename: "vue.js"
        },*/
        "vueSelect":{
            import: ['vue-select/dist/vue-select.css'],
            filename:'vue-select.js'
        },
    },
    resolve: {
        alias: {
            jquery: "jquery/src/jquery",
            vue: 'vue/dist', //shortens the import
            buildingblocks: "@netbofia/buildingblocks"
        }
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "./views/webpack.pug",
            filename: path.resolve(__dirname, 'views/layout.pug'),
            inject: 'body',
            publicPath: '/admin/public/webpack',
            minify:false
        }),
        new HtmlWebpackPugPlugin(),
        new webpack.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery",
            buildingblocks: "buildingblocks",
            //Vue: ["vue/vue.esm.browser.js","Vue"],
            //vSelect:["vue-select","vSelect"]
        })
    ],
    output: {
        path: path.resolve(__dirname, 'public/webpack'),
    },
    module: {
        rules: [
            {
                test: /\.css$/i,
                use:['style-loader','css-loader']
            },{
                test:/\.js$/,
                enforce: "pre",
                use:['source-map-loader']
            },{
                test: /\.(scss)$/,
                use: [
                    {
                        // Adds CSS to the DOM by injecting a `<style>` tag
                        loader: 'style-loader'
                    },
                    {
                        // Interprets `@import` and `url()` like `import/require()` and will resolve them
                        loader: 'css-loader'
                    },
                    {
                        // Loader for webpack to process CSS with PostCSS
                        loader: 'postcss-loader',
                        options: {
                            postcssOptions: {
                                plugins: [
                                    autoprefixer
                                ]
                            }
                        }
                    },
                    {
                        // Loads a SASS/SCSS file and compiles it to CSS
                        loader: 'sass-loader'
                    }
                ]
            }]
    }
};
