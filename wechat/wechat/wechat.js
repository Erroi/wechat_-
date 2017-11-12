'use strict';
var Promise = require('bluebird');
var request = Promise.promisify(require('request'));
var util = require('./util');
var fs = require('fs');

var prefix = 'https://api.weixin.qq.com/cgi-bin/';
var api = {
	semantic : 'https://api.weixin.qq.com/semantic/semproxy/search?',
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
		del:prefix + 'material/del_material?',  //删除 
		update: prefix + "material/update_news?",  //修改
		count: prefix + 'material/get_materialcount?',  //获取素材总数
		batch: prefix + 'material/batchget_material?'   //获取素材列表
	},
	tags:{
		create: prefix + 'tags/create?',
		fetch: prefix + 'tags/get?',
		check: prefix + 'tags/update?',
		userGet: prefix + '/user/tag/get?',  //获取标签下粉丝列表
		delet: prefix + 'tags/delet?',
		batchTag: prefix + 'tags/members/batchtagging?',  //批量为用户打标签
		unbatchTag: prefix + 'tags/members/batchuntagging?', //批量为用户取消标签
		getidList: prefix + 'tags/getidlist?',  //获取用户身上的标签列表

	},
	user:{
		remark: prefix + 'user/info/updateremark?',   //设置用户备注名 服务号
		fetch: prefix + 'user/info?',         //获取用户基本信息
		batchFetch: prefix + 'user/info/batchget?',  //批量获取用户
		get: prefix + 'user/get?',   //获取用户列表
	},
	mass:{
		group: prefix + 'message/mass/sendall?',    //群发消息  根据类型
		openId: prefix + 'message/mass/send?',    //群发消息   根据openID
		delete: prefix + 'message/mass/delete?',  //删除群发消息
		preview: prefix + 'message/mass/preview?',   //预览
		check: prefix + 'message/mass/get?',    //查询群发状态
	},
	menu:{
		create: prefix + 'menu/create?',
		fetch: prefix + 'menu/get?',
		delete: prefix + 'menu/delete?',
		current: prefix + 'get_current_selfmenu_info?'   //返回配置菜单
	},
	ticket:{
		get:prefix + 'ticket/getticket?',
	}
}

function Wechat(opts) {
	this.appId = opts.appId;
	this.appSecret = opts.appSecret;
	this.getAccessToken = opts.getAccessToken;
	this.saveAccessToken = opts.saveAccessToken;
	this.getTicket = opts.getTicket;
	this.saveTicket = opts.saveTicket;

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

Wechat.prototype.fetchTicket = function (access_token) {
	var that = this;
	
	return this.getTicket()
		.then(function (data) {
			try {
				data = JSON.parse(data);
			} catch (e) {
				return that.updateTicket(access_token);
			}

			if (that.isValidTicket(data)) {
				return Promise.resolve(data);
			} else {
				return that.updateTicket(access_token);
			}
		})
		.then(function (data) {
			that.saveTicket(data);

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

Wechat.prototype.isValidTicket = function (data) {
	if (!data || !data.ticket || !data.expires_in) {
		return false;
	}

	var ticket = data.ticket;
	var expires_in = data.expires_in;
	var now = (new Date().getTime());

	if (ticket && now < expires_in) {
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

Wechat.prototype.updateTicket = function () {
	var that = this;
	that
		.fetchAccessToken()
		.then(function(data){
			var url = api.ticket.get + "&access_token=" + data.access_token + '&type=jsapi';

			return new Promise(function (resolve, reject) {
				request({ url: url, json: true }).then(function (response) {
					var data = response.body;
					var now = (new Date().getTime());
					var expires_in = now + (data.expires_in - 20) * 1000;

					data.expires_in = expires_in;
					resolve(data);
				})
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
				let url = uploadUrl + 'access_token=' + data.access_token ;
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

	
	return new Promise(function (resolve, reject) {
		that
			.fetchAccessToken()
			.then(function (data) {
				let url = fetchUrl + 'access_token=' + data.access_token;
				let form = {};
				let options = {method: 'POST',url:url,json:true}
				if(permanent){
					form.media_id = mediaId;
					form.access_token = data.access_token;
					options.body = form;
				}else{
					if(type === 'video'){
						url = url.replace('https://','http://')
					}
					url += '&media_id=' + mediaId;
				}
				if(type === 'news' || type === 'video'){
					request(options).then(function(response){
						var _data = response.body;
						if(_data){
							resolve(_data);
						}else{
							throw new Error('fetch material failed')
						}
					}).catch(function(err){
						reject(err)
					})
				}else{
					resolve(url)
				}
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
				let url = api.permanent.del + 'access_token=' + data.access_token + '&media_id=' + mediaId ;
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
	
	return new Promise(function (resolve, reject) {
		that
			.fetchAccessToken()
			.then(function (data) {
				let url = api.permanent.update + 'access_token=' + data.access_token + '&media_id=' + mediaId ;
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

//计数永久素材
Wechat.prototype.countMaterial = function(){
	let that = this;
	
	return new Promise(function (resolve, reject) {
		that
			.fetchAccessToken()
			.then(function (data) {
				let url = api.permanent.update + 'access_token=' + data.access_token;
				request({method:'GET',url:url,json:true}).then(function (response) {
					let _data = response.body;

					if (_data) {
						resolve(_data);
					} else {
						throw new Error('count material fails')
					}
				}).catch(function (err) {
					reject(err);
				})
			})

	})
}

//修改永久素材
Wechat.prototype.batchMaterial = function(options){
	let that = this;
	
	options.type = options.type || 'image';
	options.offset = options.offset || 0;
	options.count = options.count || 1;

	
	return new Promise(function (resolve, reject) {
		that
			.fetchAccessToken()
			.then(function (data) {
				let url = api.permanent.batch + 'access_token=' + data.access_token;
				request({method:'POST',url:url,body:options,json:true}).then(function (response) {
					let _data = response.body;

					if (_data) {
						resolve(_data);
					} else {
						throw new Error('Batch material fails')
					}
				}).catch(function (err) {
					reject(err);
				})
			})

	})
}

//创建标签
Wechat.prototype.createTag = function(name){
	let that = this;

	return new Promise(function (resolve, reject) {
		that
			.fetchAccessToken()
			.then(function (data) {
				let url = api.tags.create + 'access_token=' + data.access_token;
				let options = {
					tag:{
						name:name
					}
				};
				request({method:'POST',url:url,body:options,json:true}).then(function (response) {
					let _data = response.body;

					if (_data) {
						resolve(_data);
					} else {
						throw new Error('createTag fails')
					}
				}).catch(function (err) {
					reject(err);
				})
			})

	})
}

//获取标签
Wechat.prototype.fetchTag = function(){
	let that = this;

	return new Promise(function (resolve, reject) {
		that
			.fetchAccessToken()
			.then(function (data) {
				let url = api.tags.fetch + 'access_token=' + data.access_token;
				
				request({method:'GET',url:url,json:true}).then(function (response) {
					let _data = response.body;

					if (_data) {
						resolve(_data);
					} else {
						throw new Error('fetchTag fails')
					}
				}).catch(function (err) {
					reject(err);
				})
			})

	})
}

//编辑标签
Wechat.prototype.updateTag = function(id,name){
	let that = this;

	return new Promise(function (resolve, reject) {
		that
			.fetchAccessToken()
			.then(function (data) {
				let url = api.tags.check + 'access_token=' + data.access_token;
				let options = {
					tag:{
						id:id,
						name:name
					}
				};
				request({method:'POST',url:url,body:options,json:true}).then(function (response) {
					let _data = response.body;

					if (_data) {
						resolve(_data);
					} else {
						throw new Error('updateTag fails')
					}
				}).catch(function (err) {
					reject(err);
				})
			})

	})
}

//删除标签
Wechat.prototype.deleteTag = function(id){
	let that = this;

	return new Promise(function (resolve, reject) {
		that
			.fetchAccessToken()
			.then(function (data) {
				let url = api.tags.delet + 'access_token=' + data.access_token;
				let options = {
					tag:{
						id:id
					}
				};
				request({method:'POST',url:url,body:options,json:true}).then(function (response) {
					let _data = response.body;

					if (_data) {
						resolve(_data);
					} else {
						throw new Error('deleteTag fails')
					}
				}).catch(function (err) {
					reject(err);
				})
			})

	})
}

//设置用户备注名
Wechat.prototype.remarkUser = function(openId,remark){
	let that = this;

	return new Promise(function (resolve, reject) {
		that
			.fetchAccessToken()
			.then(function (data) {
				let url = api.user.remark + 'access_token=' + data.access_token;
				let options = {
					openid:openId,
					remark:remark
				};
				request({method:'POST',url:url,body:options,json:true}).then(function (response) {
					let _data = response.body;

					if (_data) {
						resolve(_data);
					} else {
						throw new Error('remarkUser fails')
					}
				}).catch(function (err) {
					reject(err);
				})
			})

	})
}

//获取用户基本信息
Wechat.prototype.fetchUsers = function(openid,lang){
	let that = this;
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
		.then(function(data){
			let url = api.user.fetch + 'access_token=' + data.access_token + '&openid=' + openid + '&lang=' + lang;
			request({url:url,json:true}).then(function(res){
				let _data = res.body;
				if(_data){
					resolve(_data);
				}else{
					throw new Error('fetchUser')
				}
			}).catch(function(err){
				reject(err);
			})
		})
	})
}

//批量获取用户信息
Wechat.prototype.batchFetchUser = function(userList){
	let that = this;
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
		.then(function(data){
			let url = api.user.batchFetch + 'access_token=' + data.access_token;
			request({method:'POST',body:{user_list:userList},url:url,json:true}).then(function(res){
				let _data = res.body;
				if(_data){
					resolve(_data);
				}else{
					throw new Error('fetchUser')
				}
			}).catch(function(err){
				reject(err);
			})
		})
	})
}

//获取用户列表
Wechat.prototype.getUserList = function(nextOpenid){
	let that = this;
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
		.then(function(data){
			let url = api.user.get + 'access_token=' + data.access_token;
			if(nextOpenid){
				url += '&next_openid=' + nextOpenid;
			}
			request({url:url,json:true}).then(function(res){
				let _data = res.body;
				if(_data){
					resolve(_data);
				}else{
					throw new Error('fetchUser')
				}
			}).catch(function(err){
				reject(err);
			})
		})
	})
}

//获取用户地理位置


//根据标签进行群发消息
Wechat.prototype.sendByGroup = function(type,message,groupId){
	var that = this;
	var msg = {
		filter:{},
		msgtype:type,
		[type]:message
	}

	if(!groupId){
		msg.filter.is_to_all = true
	}else{
		msg.filter = {
			is_to_all: false,
			group_id:groupId
		}
	}

	return new Promise(function(resolve,reject){
		that
			.fetchAccessToken()
			.then(function(data){
				var url = api.mass.group + 'access_token=' + data.access_token;

				request({method:'POST',url:url,body:msg,json:true}).then(function(response){
					var _data = response.body;
					if(_data){
						resolve(_data);
					}else{
						throw new Error('sendByGroup failed');
					}
				}).catch(function(err){
					reject(err)
				})
			})
	})
}

//根据openID进行群发消息
Wechat.prototype.sendByOpenId = function(type,message,openIds){
	var that = this;
	var msg = {
		touser:openIds,
		msgtype:type,
		[type]:message
	}

	return new Promise(function(resolve,reject){
		that
			.fetchAccessToken()
			.then(function(data){
				var url = api.mass.openId + 'access_token=' + data.access_token;

				request({method:'POST',url:url,body:msg,json:true}).then(function(response){
					var _data = response.body;
					if(_data){
						resolve(_data);
					}else{
						throw new Error('sendByGroup failed');
					}
				}).catch(function(err){
					reject(err)
				})
			})
	})
}

//删除群发消息
Wechat.prototype.deleteMass = function(msgId){
	var that = this;

	return new Promise(function(resolve,reject){
		that
			.fetchAccessToken()
			.then(function(data){
				var url = api.mass.delete + 'access_token=' + data.access_token;

				var form = {
					msg_id:msgId,
					article_idx:1
				}

				request({method:'POST',url:url,body:msg,json:true}).then(function(response){
					var _data = response.body;
					if(_data){
						resolve(_data);
					}else{
						throw new Error('sendByGroup failed');
					}
				}).catch(function(err){
					reject(err)
				})
			})
	})
}

//预览群发消息
Wechat.prototype.previewMass = function(type,message,openId){
	var that = this;
	var msg = {
		touser:openId,
		msgtype:type,
		[type]:message
	}

	return new Promise(function(resolve,reject){
		that
			.fetchAccessToken()
			.then(function(data){
				var url = api.mass.preview + 'access_token=' + data.access_token;

				request({method:'POST',url:url,body:msg,json:true}).then(function(response){
					var _data = response.body;
					if(_data){
						resolve(_data);
					}else{
						throw new Error('sendByGroup failed');
					}
				}).catch(function(err){
					reject(err)
				})
			})
	})
}

//检查群发状态
Wechat.prototype.checkMass = function(msgId) {
	var that = this
  
	return new Promise(function(resolve, reject) {
	  that
		.fetchAccessToken()
		.then(function(data) {
		  var url = api.mass.check + 'access_token=' + data.access_token
		  var form = {
			msg_id: msgId
		  }
  
		  request({method: 'POST', url: url, body: form, json: true}).then(function(response) {
			var _data = response.body;
  
			if (_data) {
			  resolve(_data)
			}
			else {
			  throw new Error('Check mass fails')
			}
		  })
		  .catch(function(err) {
			reject(err)
		  })
		})
	})
}

//创建菜单
Wechat.prototype.createMenu = function(menu){
	var that = this;

	return new Promise(function(resolve,reject){
		that
			.fetchAccessToken()
			.then(function(data){
				var url = api.menu.create + 'access_token=' + data.access_token;

				request({method: 'POST',url:url,body:menu,json:true}).then(function(response){
					var _data = response.body;

					if(_data){
						resolve(_data);
					}else{
						throw new Error('Create menu fails');
					}
				}).catch(function(err){
					reject(err)
				})
			})
	})
}

//获取菜单
Wechat.prototype.fetchMenu = function(){
	var that = this;

	return new Promise(function(resolve,reject){
		that
			.fetchAccessToken()
			.then(function(data){
				var url = api.menu.fetch + 'access_token=' + data.access_token;

				request({url:url,json:true}).then(function(response){
					var _data = response.body;

					if(_data){
						resolve(_data);
					}else{
						throw new Error('Create menu fails');
					}
				}).catch(function(err){
					reject(err)
				})
			})
	})
}

//删除菜单
Wechat.prototype.deleteMenu = function(){
	var that = this;

	return new Promise(function(resolve,reject){
		that
			.fetchAccessToken()
			.then(function(data){
				var url = api.menu.delete + 'access_token=' + data.access_token;

				request({url:url,json:true}).then(function(response){
					var _data = response.body;

					if(_data){
						resolve(_data);
					}else{
						throw new Error('Create menu fails');
					}
				}).catch(function(err){
					reject(err)
				})
			})
	})
}

//获取菜单配置
Wechat.prototype.getCurrentMenu = function(){
	var that = this;

	return new Promise(function(resolve,reject){
		that
			.fetchAccessToken()
			.then(function(data){
				var url = api.menu.current + 'access_token=' + data.access_token;

				request({url:url,json:true}).then(function(response){
					var _data = response.body;

					if(_data){
						resolve(_data);
					}else{
						throw new Error('Create menu fails');
					}
				}).catch(function(err){
					reject(err)
				})
			})
	})
}

Wechat.prototype.semantic = function(mess){
	var that = this;

	return new Promise(function(resolve,reject){
		that
			.fetchAccessToken()
			.then(function(data){
				var url = api.semantic + 'access_token=' + data.access_token;
				mess.appId = data.appId;

				request({url:url,body:mess,method:'POST',json:true}).then(function(response){
					var _data = response.body;

					if(_data){
						resolve(_data);
					}else{
						throw new Error('semantic fails');
					}
				}).catch(function(err){
					reject(err)
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