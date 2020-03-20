let path = require('path')
let HtmlWebpackPlugin = require('html-webpack-plugin')
let MiniCssExtractPlugin = require('mini-css-extract-plugin')
let OptimizeCssAssetsWebpackPlugin = require('optimize-css-assets-webpack-plugin')
let { CleanWebpackPlugin } = require('clean-webpack-plugin')
let WorkboxWebpackPlugin = require('workbox-webpack-plugin')
let webpack = require('webpack')
let AddAssetHtmlWebpackPlugin = require('add-asset-html-webpack-plugin')
let TerserWebpackPlugin=require('terser-webpack-plugin')

// 设置nodejs环境变量,决定使用browserslist的哪个环境
process.env.NODE_ENV = 'production'

// 复用loader
const commonCssLoader = [
  //use数组中loader执行顺序：从右到左，从下到上依次执行
  {
    loader: MiniCssExtractPlugin.loader,
    options: { publicPath: '../' }
  },
  'css-loader',  //将css文件变成commonjs模块加载js中，里面内容是样式字符串
  { //postcss-preset-env插件帮助postcss找到package.json中browserslist里面的配置，通过配置加载指定的css兼容性样式
    loader: 'postcss-loader',
    options: {
      ident: 'postcss', //默认配置
      plugins: () => [
        // postcss插件
        require('postcss-preset-env')()
      ]
    }
  }
]

// tree snaking:去除无用代码：前提：必须使用es6模块化，开启production环境
// 作用：减少代码体积
/* 
  在package.json中配置：
  "sideEffects":false 所有代码都没有副作用（都可以进行tree snaking),问题：可能会把css/@babel/polyfill(副作用)文件删除
  "sideEffects":["*.css","*.less"]，这样设置就不会删除所要的文件
*/

module.exports = {
  // 文件资源缓存，使用hash改变文件名刷新缓存,每次webpack构建打包会生成唯一一个hash值
  // 使用chunkhash，因为根据chunk生成的hash值，如果打包来源于同一个chunk，那么hash值就是一样，但是因为css是在js文件中引入，所以同属于一个chunk，hash值也一样。
  // 推荐使用contenthash:根据文件的内容生成hash值。不同文件hash值一定不一样
  entry: './src/index.js',  //单入口
  /* entry: {//多入口,不推荐使用，推荐optimization+单入口
    main:'./src/index.js',
    test:'./src/test.js',
  },  */
  output: {
    filename: './js/[name].[contenthash:10].js',
    path: path.resolve(__dirname, 'docs'),
    // chunkFilename:'js/[name]_chunks.js' //非入口chunk的名称
  },
  // loader配置
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        // 处理js文件,优先执行eslint-loader
        enforce: 'pre',
        loader: 'eslint-loader',
        options: {
          // 自动修复错误
          fix: true
        }
      },
      // 以下loader只会匹配一个，注意不能有两个配置处理同一类型文件，oneOf提升打包构建速度
      {
        oneOf: [
          {
            test: /\.css$/,
            use: [...commonCssLoader]
          },
          {
            test: /\.less$/,
            use: [
              ...commonCssLoader,
              'less-loader'
            ]
          },
          {
            test: /\.(jpg|jpeg|gif|bmp|png|ico)$/,
            loader: 'url-loader',
            options: {//图片大小小于8kb，就会被base64处理，优点：减少请求数量（减轻服务器压力），缺点：图片体积更大（文件请求速度更慢）
              limit: 8 * 1024,
              // 因为url-loader默认使用ES6模块化解析，而html-loader引入图片是commonjs，解析时会出现问题：[object Module]
              // 解决方法：关闭url-loader的ES6模块化，使用commonjs解析
              esModule: false,
              // 给图片进行重命名
              name: './img/[hash:10].[ext]'
            }
          },
          {
            test: /\.html$/,
            loader: 'html-loader'  //处理html文件的img图片（负责引入img，从而能被url-loader进行处理）
          },
          {
            // exclude:/\.(css|js|html)$/ //排除css/js/html资源
            test: /\.(ttf|eot|svg|woff|woff2)$/,
            loader: 'file-loader',
            options: { name: './fonts/[name].[hash:8].[ext]' }
          },
          // js兼容性处理：babel-loader @babel/preset-env @babel/core
          // 基本js兼容性处理，promise不能转换
          // 全部js兼容性处理使用@babel/polyfill,缺点是将所有兼容性代码全部引入，体积太大了。
          // 做兼容性处理，按需加载 core-js
          {
            test: /\.js$/,
            exclude: /node_modules/,
            use: [
              // 开启多进程打包，只有工作消耗时间比较长，才需要多进程打包
              {
                loader: 'thread-loader',
                options: {
                  workers: 2 //进程2个
                }
              },
              {
                loader: 'babel-loader',
                options: {
                  // 预设：指示babel做怎么样的兼容性处理
                  presets: [
                    [
                      '@babel/preset-env',
                      {
                        // 按需加载
                        useBuiltIns: 'usage',
                        // 指定core-js版本
                        corejs: {
                          version: 3
                        },
                        // 指定兼容性做到哪个版本浏览器
                        targets: {
                          chrome: '60',
                          firefox: '60',
                          ie: '9',
                          safari: '10',
                          edge: '17'
                        }
                      }
                    ]
                  ],
                  // 开启babel缓存
                  // 第二次构建时，会读取之前的缓存
                  cacheDirectory: true
                }
              }
            ]
          }
        ]
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      minify: {
        // 移除空格
        collapseWhitespace: true,
        // 移除注释
        removeComments: true
      }
    }),
    new MiniCssExtractPlugin({
      filename: 'css/main.[contenthash:10].css'
    }),
    new OptimizeCssAssetsWebpackPlugin(),
    //参数是一个数组，数组中是需要删除的目录名
    new CleanWebpackPlugin(),
    new WorkboxWebpackPlugin.GenerateSW({
      // 帮助serviceworker快速启动，删除旧的serviceworker，生成一个serviceworker配置文件
      clientsClaim: true,
      skipWaiting: true
    }),
    // 告诉webpack哪些库不参与打包，同时使用时的名称也得变
    new webpack.DllReferencePlugin({
      manifest: path.resolve(__dirname, 'dll/manifest.json')
    }),
    // 引入webpack.dll.js文件的预置包
    new AddAssetHtmlWebpackPlugin({
      filepath: path.resolve(__dirname, 'dll/jquery.js')
    })
  ],
  // 可以将node_modules中代码单独打包一个chunk最终输出，自动分析多入口chunk中，有没有公共的文件，如果有会打包成单独一个chunk
  optimization: {
    splitChunks: {
      chunks: 'all'

      // 这些是默认值，可以不写
      /* minSize:30*1024,  //分割的chunk最小为30kb，不然不分割
      maxSize:0,  //最大没有限制
      minChunks:1,    //要提取的chunk最少被引用1次，没引用过说明项目里根本没使用这个依赖
      maxAsyncRequests:5, //按需加载时并行加载的文件的最大数量
      maxInitialRequests:3, //入口js文件最大并行请求数量
      automaticNameDelimiter:'~', //名称连接符
      name:true,  //可以使用命名规则
      cacheGroups:{ //分割chunk的组
        vendors:{
          // node_modules文件会被打包到vendors组的chunk中。--->vendors~xxx.js
          // 满足上面的公共规则，如：大小超过30kb，至少被引用一次
          test:/[\\/]node_modules[\\/]/,
          // 优先级
          priority:-10
        },
        default:{
          // 要提取的chunk最少被引用2次
          minChunks:2,
          priority:-20,
          // 如果当前要打包的模块和之前已经被提取的模块是同一个，就会复用，而不是重新打包模块
          reuseExistingChunk:true
        }
      } */

    },
    // 将当前模块的记录其他模块的hash单独打包为一个文件runtime
    // 解决：修改a文件导致b文件的contenthash变化
    /* runtimeChunk:{
      name:entrypoint=>`runtime-${entrypoint.name}`
    }, */
    minimizer:[
      // 配置生产环境的压缩方案：js和css
      new TerserWebpackPlugin({
        // 开启缓存
        cache:true,
        // 开启多进程打包
        parallel:true,
        // 启动source-map
        sourceMap:true
      })
    ]
  },
  mode: 'production',
  /* externals:{  //忽略后直接用CDN的
    // 忽略库名--npm包名
    jquery:'jQuery'
  } */
}