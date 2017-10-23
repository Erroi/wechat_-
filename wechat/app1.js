"use strict";

var Koa = require('koa');
var sha1 = require('sha1');
var config = {
    wechat:{
        appID:'wx7db9c332dcb04d9f',
        appSecret:'0a2c659a9e2d2b2fd3542e66a4958997',
        token:'yangqiandeweixingongzhonghao',
    }
}

var app = new Koa();

app.use(function *(next){
    console.log(this.query);

    var token = config.wechat.token;
    var signature = this.query.signature;
    var nonce = this.query.nonce;
    var timestamp = this.query.timestamp;
    var echostr = this.query.echostr;
    var str = [token,timestamp,nonce].sort().join("");
    var sha = sha1(str);

    if(sha === signature){
        this.body = echostr + '';
    }else{
        this.body = "wrong";
    }
})

app.listen(1234)
console.log('Listening:1234')