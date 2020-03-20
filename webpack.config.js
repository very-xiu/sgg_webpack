let path = require('path')
let HtmlWebpackPlugin = require('html-webpack-plugin')
let MiniCssExtractPlugin = require('mini-css-extract-plugin')

// 设置nodejs环境变量
process.env.NODE_ENV = 'development'

// 复用postcss-loader函数
const commonPostCss = { //postcss-preset-env插件帮助postcss找到package.json中browserslist里面的配置，通过配置加载指定的css兼容性样式
  loader: 'postcss-loader',
  options: {
    ident: 'postcss',
    plugins: () => [
      // postcss插件
      require('postcss-preset-env')()
    ]
  }
}

module.exports = {
  entry: ['./src/index.js','./src/index.html'],
  output: {
    filename: './js/built.js',
    path: path.resolve(__dirname, 'docs')
  },
  // loader配置
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [  //use数组中loader执行顺序：从右到左，从下到上依次执行
          'style-loader',//创建style标签，将js中的样式资源插入进行，添加到head中生效
          'css-loader',  //将css文件变成commonjs模块加载js中，里面内容是样式字符串
          commonPostCss
        ]
      },
      {
        test: /\.less$/,
        use: [
          'style-loader',
          'css-loader',
          commonPostCss,
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
      // 语法检查:设置检查规则：package.json中eslintConfig中设置,推荐airbnb检查规则，需要的包：eslint eslint-config-airbnb-base eslint-plugin-import eslint-loader
      /* {
        test:/\.js$/,
        exclude:/node_modules/,
        loader:'eslint-loader',
        options:{
          // 自动修复错误
          fix:true
        }
      } */
      // js兼容性处理：babel-loader @babel/preset-env @babel/core
      // 基本js兼容性处理，promise不能转换
      // 全部js兼容性处理使用@babel/polyfill,缺点是将所有兼容性代码全部引入，体积太大了。
      // 做兼容性处理，按需加载 core-js
      {
        test: /\.js$/,
        exclude: /node_modules/,
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
          cacheDirectory:true
        }
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html'
    }),
    new MiniCssExtractPlugin({
      filename: 'css/main.css'
    })
  ],
  mode: 'development',
  // mode:'production'
  devServer: {
    contentBase: path.resolve(__dirname, 'docs'),
    // 监视contentBase目录下所有文件，一旦文件变化就会reload
    watchContentBase:true,
    watchOptions:{
      // 忽略文件
      ignored:/node_modules/
    },
    // 启动gzip压缩
    compress: true,
    port: 3000,
    open: true,
    hot: true,
    // 不显示启动服务器日志信息
    // clientLogLevel:true,
    // 除了一些基本启动信息以外，其他内容不显示
    // quiet:true,
    // 如果出现错误，不要全屏提示
    overlay:false,
    // 服务器代理-->解决开发环境跨域问题
    proxy:{
      // 一旦devServer(3000)服务器接收到/api/xxx的请求，就会把请求转发到另一个服务器(5000)
      '/api':{
        target:'http://localhost:5000',
        // 发送请求时，请求路径重写：将/api/xxx--->/xxx(去掉/api)
        pathRewrite:{
          '^/api':''
        }
      }
    }
  },
  // devtool:'eval-source-map'
}