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
            <div id="director"></div>
            <div id="year"></diiv>
            <div id="poster"></div>
            <script src="http://zeptojs.com/zepto-docs.min.js"></script>
            <script src="https://res.wx.qq.com/open/js/jweixin-1.2.0.js"></script>
            <script>
                wx.config({
                    debug: false, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
                    appId: 'wx7db9c332dcb04d9f', // 必填，公众号的唯一标识
                    timestamp: '<%= timestamp %>', // 必填，生成签名的时间戳
                    nonceStr: '<%= noncestr %>', // 必填，生成签名的随机串
                    signature: '<%= signature %>',// 必填，签名，见附录1
                    jsApiList: [
                        'onMenuShareTimeline',
                        'onMenuShareAppMessage',
                        'onMenuShareQQ',
                        'onMenuShareWeibo',
                        'onMenuShareQZone',
                        'startRecord',
                        'stopRecord',
                        'onVoiceRecordEnd',
                        'translateVoice'
                    ] // 必填，需要使用的JS接口列表，所有JS接口列表见附录2
                });
                wx.ready(function(){
                    wx.checkJsApi({
                        jsApiList: ['onVoiceRecordEnd'], // 需要检测的JS接口列表，所有JS接口列表见附录2,
                        success: function(res) {
                            console.log('w',res)
                        }
                    });

                    var isRecording = false;
                    $('h1').on('tap',function(){
                        if(!isRecording){
                            isRecording = true;
                            wx.startRecord({
                                cancel:function(){
                                    window.alert('那就不能搜了哦')
                                }
                            })
                            return
                        }
                        isRecording = false;

                        wx.onVoiceRecordEnd({

                            // 录音时间超过一分钟没有停止的时候会执行 complete 回调

                            complete: function (res) {

                                var localId = res.localId; 

                                wx.translateVoice({

                                    localId: localId, // 需要识别的音频的本地Id，由录音相关接口获得

                                    isShowProgressTips: 1, // 默认为1，显示进度提示

                                    success: function (res) {

                                        alert(res.translateResult); // 语音识别的结果
                                        $.ajax({
                                            type:'get',
                                            url:'https://api.douban.com/v2/movie/search?q=' + result,
                                            dataType:'jsonp',
                                            jsonp:'callback',
                                            success:function(data){
                                                var subject = data.subjects[0];

                                                $('#title').html(subject.title);
                                                $('#year').html(subject.year);
                                                $('#director').html(subject.directors[0].name);
                                                $('#poster').html('<img src="' + subject.images.large +  '" />')
                                            }
                                        })
                                    }

                                    });

                            }

                        });
                    })
                })
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
});

// app.use(async function(ctx,next){
//     if(ctx.request.url.indexOf('/movie') > -1){
//         var wechatApi = new Wechat(config.wechat);
//         var data = await wechatApi.fetchAccessToken();
//         var access_token = data.access_token;
//         var ticketData = await wechatApi.fetchTicket(access_token);
//         var ticket = data.ticket;
//         let url = ctx.request.href;
//         let params = sign(ticket,url);
//         console.log(params);
//         ctx.body = ejs.render(tpl,params);

//         // next();
//     }
// })


app.use(wechat(config.wechat,weixin.reply));   //reply 相当于中间件的handler，将控制权交给此。

app.listen(1234);

console.log('listning:1234');