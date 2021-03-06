"use strict";

var path = require('path');
var wechat_file = path.join(__dirname,'./config/wechat.txt');
var wechat_ticket_file = path.join(__dirname,'./config/wechat_ticket.txt');
var util = require('./libs/util');

var config = {
	wechat:{
		appId:'wx7db9c332dcb04d9f',
		appSecret:'0a2c659a9e2d2b2fd3542e66a4958997',
		token:'yangqiandeweixingongzhonghao',

		getAccessToken:function(){
			return util.readFileAsync(wechat_file);
		},
		saveAccessToken:function(data){
			var data = JSON.stringify(data)
			return util.writeFileAsync(wechat_file,data);
		},
		getTicket:function(){
			return util.readFileAsync(wechat_ticket_file);
		},
		saveTicket:function(data){
			var data = JSON.stringify(data)
			return util.writeFileAsync(wechat_ticket_file,data);
		}
	}
}

module.exports = config;