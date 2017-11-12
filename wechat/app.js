"use strict"

var Koa = require('koa');
var path = require('path');
var wechat = require('./wechat/g');  //中间件
var util = require('./libs/util');
var config = require('./config');
var weixin = require('./wx/reply');

var app = new Koa();

var ejs = require('ejs');
var heredoc = require('heredoc');
var crypto = require('crypto');

var Wechat = require('./wechat/wechat');



var tpl = heredoc(function(){/*
    <!DOCTYPE html>
    <html>
        <head>
            <title>猜电影</title>
            <meta name="viewport" content="initial-scale=1,user-scale=no,minimum-scale=1,maximum-scale=1">
        </head>
        <body>
            <h1>点击标题，开始录音翻译</h1>
            <p id="title"></p>
            <div id="poster"></div>
            <script src="http://zeptojs.com/zepto-docs.min.js"></script>
            <script src="http://res.wx.qq.com/open/js/jweixin-1.2.0.js"></script>
            <script>
                wx.config({
                    debug: true, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
                    appId: 'wx7db9c332dcb04d9f', // 必填，公众号的唯一标识
                    timestamp: '<%= timestamp %>', // 必填，生成签名的时间戳
                    nonceStr: '<%= noncestr %>', // 必填，生成签名的随机串
                    signature: '<%= signature %>',// 必填，签名，见附录1
                    jsApiList: [
                        'onMenuShareTimeline',
                        'onMenuShareAppMessage',
                        'onMenuShareQQ',
                        'onMenuShareWeibo',
                        'onMenuShareQZone'
                    ] // 必填，需要使用的JS接口列表，所有JS接口列表见附录2
                });
            </script>
        </body>
    </html>*/
});

//随机数
var createNonce = function(){
    return Math.random().toString(36).substr(2,15);
}
//时间戳
var createTimestamp = function(){
    return parseInt(new Date().getTime() / 1000, 10) + '';
}

var _sign = function(noncestr,ticket,timestamp,url){
    var params = [
        'noncestr=' + noncestr,
        'jsapi_ticket=' + ticket,
        'timestamp=' + timestamp,
        'url=' + url
    ]
    var str1 = params.sort().join('&');
    var shasum = crypto.createHash('sha1');

    shasum.update(str1);

    return shasum.digest('hex');
}

//签名
function sign(ticket,url){
    var noncestr = createNonce();
    var timestamp = createTimestamp();
    var signature = _sign(noncestr,ticket,timestamp,url);

    return {
        noncestr:noncestr,
        timestamp:timestamp,
        signature:signature
    }
}

app.use(function *(next){
    if(this.url.indexOf('/movie') > -1){
        var wechatApi = new Wechat(config.wechat);
        var data = yield wechatApi.fetchAccessToken();
        var access_token = data.access_token;
        var ticketData = yield wechatApi.fetchTicket(access_token);
        var ticket = data.ticket;
        var url = this.href;
        var params = sign(ticket,url);
console.log(params)
        this.body = ejs.render(tpl,params);

        return next;
    }
})

app.use(wechat(config.wechat,weixin.reply));   //reply 相当于中间件的handler，将控制权交给此。

app.listen(1234);

console.log('listning:1234');