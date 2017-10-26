'use strict';
var Promise = require('bluebird');
var request = Promise.promisify(require('request'));
var util = require('./util');
var fs = require('fs');

var prefix = 'https://api.weixin.qq.com/cgi-bin/';
var api = {
	access_token: prefix + 'token?grant_type=client_credential',
	temporary:{                                 //临时素材   access_token 和 type
		upload: prefix + 'media/upload?',     //上传
		fetch:prefix + 'media/get?',            //下载
	},
	permanent:{                                 //永久素材
		upload: prefix + 'material/add_material?',     //其他类型  access_token 和 type
		fetch: prefix + 'material/get_material?',
		uploadNews: prefix + 'material/add_news?',     //图文		access_token
		uploadNewsPic: prefix + 'media/uploadimg?',     //消息内图片   access_token
		del:prefix + '/material/del_material?',  //删除 
		update: prefix + "material/update_news?"  //修改
	}
}

function Wechat(opts) {
	this.appId = opts.appId;
	this.appSecret = opts.appSecret;
	this.getAccessToken = opts.getAccessToken;
	this.saveAccessToken = opts.saveAccessToken;

	this.fetchAccessToken();
}

Wechat.prototype.fetchAccessToken = function () {
	var that = this;
	if (this.access_token && this.expires_in) {
		if (this.isValidAccessToken(this)) {
			return Promise.resolve(this);
		}
	}

	return this.getAccessToken()
		.then(function (data) {
			try {
				data = JSON.parse(data);
			} catch (e) {
				return that.updateAccessToken();
			}

			if (that.isValidAccessToken(data)) {
				return Promise.resolve(data);
			} else {
				return that.updateAccessToken();
			}
		})
		.then(function (data) {
			that.access_token = data.access_token;
			that.expires_in = data.expires_in;

			that.saveAccessToken(data);

			return Promise.resolve(data);
		})
}

Wechat.prototype.isValidAccessToken = function (data) {
	if (!data || !data.access_token || !data.expires_in) {
		return false;
	}

	var access_token = data.access_token;
	var expires_in = data.expires_in;
	var now = (new Date().getTime());

	if (now < expires_in) {
		return true;
	} else {
		return false;
	}
}


Wechat.prototype.updateAccessToken = function () {
	var appId = this.appId;
	var appSecret = this.appSecret;
	var url = api.access_token + "&appid=" + appId + "&secret=" + appSecret;

	return new Promise(function (resolve, reject) {
		request({ url: url, json: true }).then(function (response) {
			var data = response.body;
			var now = (new Date().getTime());
			var expires_in = now + (data.expires_in - 20) * 1000;

			data.expires_in = expires_in;
			resolve(data);
		})
	})
}

Wechat.prototype.uploadMaterial = function (type, material,permanent) {
	let that = this;
	let form = {};
	
	let uploadUrl = api.temporary.upload;
	if(permanent){
		uploadUrl = api.permanent.upload;
		// console.log(form);   //{}
		// _.extend(form,permanent);  //让form继承permanent的属性
		Object.assign(form,permanent);   //对象扩展 与上面功能一致
		console.log('3',form);  //{XXX:XXX}
	}

	//如果是图片、视屏 则是路径
	if(type === 'pic'){
		uploadUrl = api.permanent.uploadNewsPic;
	}

	//如果是 图文 的时候，material是数组，
	if(type === 'news'){
		uploadUrl = api.permanent.uploadNews;
		form = material;
	}else{
		form.media = fs.createReadStream(material)
	}

	let appId = this.appId;
	let appSecret = this.appSecret;
	return new Promise(function (resolve, reject) {
		that
			.fetchAccessToken()
			.then(function (data) {
				let url = uploadUrl + '&access_token=' + data.access_token ;
				if(!permanent){
					url += '&type=' + type;
				}else{
					form.access_token = data.access_token;
				}
				let options = {
					method:'POST',
					url:url,
					json:true,
				}
				if(type === 'news'){
					options.body = form;
				}else{
					options.formData = form;
				}
				request(options).then(function (response) {
					let _data = response.body;

					if (_data) {
						resolve(_data);
					} else {
						throw new Error('Upload material fails')
					}
				}).catch(function (err) {
					reject(err);
				})
			})

	})
}

//下载素材
Wechat.prototype.fetchMaterial = function (mediaId, type,permanent) {
	let that = this;
	let form = {};
	
	let fetchUrl = api.temporary.fetch;
	if(permanent){
		fetchUrl = api.permanent.fetch;
	}

	let appId = this.appId;
	let appSecret = this.appSecret;
	return new Promise(function (resolve, reject) {
		that
			.fetchAccessToken()
			.then(function (data) {
				let url = fetchUrl + '&access_token=' + data.access_token + '&media_id=' + mediaId ;
				if(!permanent && type == "vedio"){
					url = url.replace('https','http');
				}

				resolve(url);
			})

	})
}


//删除素材
Wechat.prototype.deletMaterial = function (mediaId) {
	let that = this;
	let form = {
		media_id:mediaId
	};
	
	let appId = this.appId;
	let appSecret = this.appSecret;
	return new Promise(function (resolve, reject) {
		that
			.fetchAccessToken()
			.then(function (data) {
				let url = api.permanent.del + '&access_token=' + data.access_token + '&media_id=' + mediaId ;
				request({method:'POST',url:url,body:form,json:true}).then(function (response) {
					let _data = response.body;

					if (_data) {
						resolve(_data);
					} else {
						throw new Error('Delet material fails')
					}
				}).catch(function (err) {
					reject(err);
				})
			})

	})
}

//修改永久素材
Wechat.prototype.updateMaterial = function(mediaId,news){
	let that = this;
	let form = {
		media_id:mediaId
	};

	Object.assign(form,news);
	
	let appId = this.appId;
	let appSecret = this.appSecret;
	return new Promise(function (resolve, reject) {
		that
			.fetchAccessToken()
			.then(function (data) {
				let url = api.permanent.update + '&access_token=' + data.access_token + '&media_id=' + mediaId ;
				request({method:'POST',url:url,body:form,json:true}).then(function (response) {
					let _data = response.body;

					if (_data) {
						resolve(_data);
					} else {
						throw new Error('Update material fails')
					}
				}).catch(function (err) {
					reject(err);
				})
			})

	})
}

Wechat.prototype.reply = function () {
	//此时的上下文为context
	var content = this.body;  //回复内容
	var message = this.weixin;  //用户发来的消息
	var xml = util.tpl(content, message);
	console.log('xml', xml)
	this.status = 200;
	this.type = "application/xml";
	this.body = xml;
}

module.exports = Wechat;