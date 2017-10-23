var koa = require('koa');
var app = koa();

// x-response-time

app.use(function *(next){
  var start = new Date;
  console.log(1)
  yield next;
  var ms = new Date - start;
  console.log(2)
  this.set('X-Response-Time', ms + 'ms');
});

// logger

app.use(function *(next){
  var start = new Date;
  console.log(3)
  yield next;
  var ms = new Date - start;
  console.log(4)
  console.log('%s %s - %s', this.method, this.url, ms);
});

// response

app.use(function *(){
	console.log(5)
  this.body = 'Hello World';
});

app.listen(3000);

//执行顺序
// 1
// 3
// 5
// 4
// GET / - 5
// 2
// 1
// 3
// 5
// 4
// GET /favicon.ico - 1
// 2
// 
// koa 通过generators来实现真正的中间件， Connect 简单地将控制权交给一系列函数来处理，直到函数返回。 与之不同，当执行到 yield next 语句时，Koa 暂停了该中间件，继续执行下一个符合请求的中间件('downstrem')，然后控制权再逐级返回给上层中间件('upstream')。