import $ from 'jquery';
import './css/index.less';
import './fonts/iconfont.css';
// import { printttt } from './prints';

// 通过js代码，让某个文件被单独打包成一个chunk,import动态导入语法，能将某个文件单独打包
import(/* webpackChunkName:'prints' */'./prints')
  .then(({printttt,count}) => {
    printttt()
  })
  .catch(() => {
    // eslint-disable-next-line
    console.log('文件加载失败~')
  })

$('#title').click(() => {
  $('body').css('backgroundColor', 'pink');
});
// $('#btn').click(() => {
//   // 懒加载
//   // 预加载：webpackPrefetch:true，浏览器空闲，偷偷加载，兼容性差，目前只适合PC端
//   import(/* webpackChunkName:'prints' */'./prints')
//   .then(({printttt,count}) => {
//     printttt()
//   })
//   .catch(() => {
//     console.log('文件加载失败~')
//   })
// });

// 下一行eslint所有规则都失效（下一行不进行eslint检查）
// eslint-disable-next-line
// console.log('eslint')
const add = (x, y) => x + y;
console.log(add(2, 10));

const promise = new Promise((resolve) => {
  setTimeout(() => {
    console.log('定时器执行完了');
    resolve();
  }, 1000);
});

// 只针对非入口js文件
/* if (module.hot) {
  // 一旦module.hot为true，说明开启了HMR功能。
  module.hot.accept('./prints.js', () => {
    // 方法会监听prints.js文件的变化，一旦发生变化，其他默认不会重新打包构建，会执行后面的回调函数
    printttt();
  });
} */

// eslint不认识window、navigator全局变量，解决：需要修改package.json中eslintConfig配置，"env":{ "borwser":true}
// 注册serviceworker
// 处理兼容性问题
if('serviceWorker' in navigator){
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('/service-worker.js')
    .then(()=>{
      console.log('sw注册成功了')
    }).catch(()=>{
      console.log('sw注册失败了')
    })
  })
}
