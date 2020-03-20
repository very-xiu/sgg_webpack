let express=require('express');
let app=express()
app.use(express.static('docs',{maxAge:1000*3600}))
app.listen(3001,()=>{
  console.log('开启服务器成功,http://localhost:3001')
})