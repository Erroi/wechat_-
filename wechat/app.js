"use strict"

var Koa = require('koa');
var path = require('path');
var wechat = require('./wechat/g');  //中间件
var wechat_file = path.join(__dirname,'./config/wechat.txt');
var util = require('./libs/util');
var config = require('./config');
var weixin = require('./weixin');

var app = new Koa();

app.use(wechat(config.wechat,weixin.reply))   //reply 相当于中间件的handler，将控制权交给此。

app.listen(1234);

console.log('listning:1234');