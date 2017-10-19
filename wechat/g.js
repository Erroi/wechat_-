"use strict";
//中间件
var sha1 = require('sha1');

var Wechat = require('./wechat');
var getRawBody = require('raw-body');
var util = require('./util');

module.exports = function(opts){
    // var wechat = new Wechat(opts);
    return function *(next){
        console.log('query',this.query)
    
        var token = opts.token;
        var signature = this.query.signature;
        var nonce = this.query.nonce;
        var timestamp = this.query.timestamp;
        var echostr = this.query.echostr;
        var str = [token,timestamp,nonce].sort().join('');
        var sha = sha1(str);

        var that = this;
    
        if(this.method === "GET"){

            if(sha === signature){
                this.body = echostr + '';
            }else{
                this.body = 'wrong';
            }
        }else if(this.method === "POST"){
            if(sha !== signature){
                this.body = 'wrong';
                return false;
            }

            var data = yield getRawBody(this.req,{
                length:this.length,
                limit:'1mb',
                encoding:this.charset
            });

            //data 是一段xml
            //封装解析xml的工具包
            var content = yield util.parseXMLAsync(data);
            // { xml:
            //     { ToUserName: [ 'gh_76601d8228c6' ],
            //       FromUserName: [ 'o0SwNws4jdUIFrlXtjkl4TBYcC8w' ],
            //       CreateTime: [ '1508394334' ],
            //       MsgType: [ 'event' ],
            //       Event: [ 'subscribe' ],
            //       EventKey: [ '' ] } }

            //继续优化数据
            var message = util.formatMessage(content.xml)
            console.log(message);
            // { ToUserName: 'gh_76601d8228c6',
            // FromUserName: 'o0SwNws4jdUIFrlXtjkl4TBYcC8w',
            // CreateTime: '1508396354',
            // MsgType: 'text',
            // Content: 'imooc',
            // MsgId: '6478513010254403416' }
             
            //定制回复内容
            if(message.MsgType === 'event'){
                if(message.Event === 'subscribe'){
                   var now = new Date().getTime();
                    
                   that.status = 200;
                   that.type = "application/xml";
                   var reply = `<xml><ToUserName><![CDATA[${message.FromUserName}]]></ToUserName>
                   <FromUserName><![CDATA[${message.ToUserName}]]></FromUserName>
                   <CreateTime>${now}</CreateTime>
                   <MsgType><![CDATA[text]]></MsgType>
                   <Content><![CDATA[Hi,i am back]]></Content>
                   </xml>`;

                   console.log('reply',reply);
                   that.body = reply;

                   return;
                   
                }
            }



        }
    }
}