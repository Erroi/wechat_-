var sha1 = require('sha1');
var Wechat = require('./wechat');
var getRawBody = require('raw-body');
var util = require('./util');


module.exports = function(opts,handler){
	var wechat = new Wechat(opts);


	return function *(next){
		console.log(this.query);

		var token = opts.token;
		var signature = this.query.signature;
		var nonce = this.query.nonce;
		var timestamp = this.query.timestamp;
		var echostr = this.query.echostr;
		var str = [token,timestamp,nonce].sort().join('');
		var sha = sha1(str);

		if (this.method === 'GET') {
			if (sha === signature) {
				this.body = echostr + '';
			}else{
				this.body = 'wrong';
			}

		}else if(this.method === 'POST'){
			if (sha !== signature) {
				this.body = 'wrong';
				return false;
			}
			var data = yield getRawBody(this.req,{
				length:this.length,
				limit:'1mb',
				encoding:this.charset,
			});

			var content = yield util.parseXMLAsync(data);

			var message = util.formatMessage(content.xml);

			// //回复内容
			// if(message.MsgType == 'text'){
			// 	var now = new Date().getTime();

			// 	this.status = 200;
			// 	this.type = 'application/xml';
			// 	this.body = `<xml>
			// 	<ToUserName><![CDATA[${message.FromUserName}]]></ToUserName>
			// 	<FromUserName><![CDATA[${message.ToUserName}]]></FromUserName>
			// 	<CreateTime>${now}</CreateTime>
			// 	<MsgType><![CDATA[text]]></MsgType>
			// 	<Content><![CDATA[你好]]></Content>
			// 	</xml>`;
			// 	return;

			// }
			this.weixin = message;  //1把消息挂载到this
			//2解析业务层
			yield handler.call(this,next);   //控制器handler，通过call改变上下文this，把next做参数传给handler。   ===》得到要返回的内容 this.body = reply Object对象
			//3通过中间件2 已经处理完解析和回复。这时将解析后的回复返回给微信 
			wechat.reply.call(this);



			console.log(message)
		}

		
	}
}