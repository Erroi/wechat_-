"use strict";

var Koa = require('koa');
var wechat = require('./wechat/g');
var path = require('path');
var wechat_file = path.join(__dirname,"./config/wechat.txt");
var util = require('./libs/util');
var config = {
    wechat:{
        appID:'wx7db9c332dcb04d9f',
        appSecret:'0a2c659a9e2d2b2fd3542e66a4958997',
        token:'yangqiandeweixingongzhonghao',
        getAccessToken:function(){
            return util.readFileAsync(wechat_file);
        },
        saveAccessToken:function(data){
            var data = JSON.stringify(data);
            return util.writeFileAsync(wechat_file,data);
        }
    }
}

var app = new Koa();

app.use(wechat(config.wechat));

app.listen(1234);
console.log('listening:1234');