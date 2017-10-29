"use strict";
var path = require('path');
var config = require('./config');
var Wechat = require('./wechat/wechat');
var wechatApi = new Wechat(config.wechat);

//回复 支付  错误通知  处理的是this.request的数据对象
exports.reply = function* (next){
    var message = this.weixin;

    if(message.MsgType == 'event'){
        if(message.Event === 'subscribe'){
            if(message.EventKey){
                console.log(`扫二维码进来:${message.EventKey} ${message.ticket}`);
            }

            this.body = `哈哈，终于找到你\n\r`
        }else if(message.Event === 'unsubscribe'){
            console.log('无情取关');
            this.body = '';
        }else if(message.Event === 'LOCATION'){
            this.body = `您上报的位置是：${message.Latitude} / ${message.Longitude} - ${message.Precision}`; 
        }else if(message.Event === 'CLICK'){
            this.body = `您点击了菜单：${message.EventKey}`;
        }else if(message.Event === 'SCAN'){
            console.log(`关注后扫描二维码${message.EventKey}  ${message.Ticket}`);
            this.body = '看到你扫了哦';
        }else if(message.Event === 'VIEW'){
            this.body = `您点击了菜单中的链接${message.EventKey}`;
        }
    }else if(message.MsgType === 'text'){
        let content = message.Content;
        let reply = `额，你说的${content}太复杂了`;
        if(content === '1'){
            reply = 'num one';
        }else if(content === '2'){
            reply = '成双入对';
        }else if(content === '3'){
            reply = '三缄其口';
        }else if(content === '4'){
            reply = [{
                title:'技术改变世界',
                description:'这是个描述',
                picUrl:'http://picapi.ooopic.com/11/91/13/93b1OOOPIC33.jpg',
                url:'https://github.com'
            },{
                title:'有太阳啦',
                description:'这是个描的述',
                picUrl:'http://picapi.ooopic.com/11/91/13/93b1OOOPIC33.jpg',
                url:'https://baidu.com'
            }]
        }else if(content === '5'){
            let data = yield wechatApi.uploadMaterial('image',path.join(__dirname,'./3.jpg'));
            reply = {
                type:'image',
                mediaId: data.media_id
            }
        }else if(content === '6'){
            let data = yield wechatApi.uploadMaterial('video',path.join(__dirname,'./6.mp4'));
            reply = {
                type:'video',
                title:'视屏测试',
                description:'我们玩一下',
                mediaId:data.media_id
            }
        }else if(content === '7'){
            let data = yield wechatApi.uploadMaterial('image',path.join(__dirname,'./3.jpg'));
           
            reply = {
                type:'music',
                title:'music 来喽',
                description:'lets play music',
                musicUrl:'http://mpge.5nd.com/2015/2015-9-12/66325/1.mp3',
                hqMusicUrl:'http://mpge.5nd.com/2015/2015-9-12/66325/1.mp3',
                thumbMediaId:data.media_id,
            }
        }else if(content === '8'){
            let data = yield wechatApi.uploadMaterial('image',path.join(__dirname,'./3.jpg'),{type:'image'});
            reply = {
                type:'image',
                mediaId: data.media_id
            }
        }else if(content === '9'){
            let data = yield wechatApi.uploadMaterial('video',path.join(__dirname,'./6.mp4'),{
                type:'video',
                description:'{"title":"video pertent ele","introduction":"never think so easy"}',
            });
            reply = {
                type:'video',
                title:'视屏测试',
                description:'我们玩一下',
                mediaId:data.media_id
            }
        }else if(content === '10'){
            var picData = yield wechatApi.uploadMaterial('image',path.join(__dirname,'./3.jpg'),{})

            var media = {
                articles:[{
                    title:'tututu4',
                    thumb_media_id: picData.media_id,
                    author:'yangqian',
                    digest:'nonono没有摘要',
                    show_cover_pic:1,
                    content:'没有内容',
                    content_source_url:'https://github.com',
                },{
                    title:'tuttutut5',
                    thumb_media_id:picData.media_id,
                    author:'yangqian',
                    digest:'5 没有摘要',
                    show_cover_pic:2,
                    content:'这是内容',
                    content_source_url:'http://github.com'
                }]
            }

            let data1 = yield wechatApi.uploadMaterial('news',media,{});
            let data = yield wechatApi.fetchMaterial(data1.media_id,'news',{});
            console.log(data);

            var items = data.news_item;
            var news = [];

            items.forEach(function(item){
                news.push({
                    title:item.title,
                    description:item.digest,
                    picUrl:picData.url,
                    url:item.url
                })
            })
            reply = news;
        }else if(content === '11'){
            var counts = yield wechatApi.countMaterial();

            console.log(counts)

            var results = yield [
                wechatApi.batchMaterial({
                    type:'image',
                    offset:0,
                    count:10
                }),
                wechatApi.batchMaterial({
                    type:'video',
                    offset:0,
                    count:10
                }),
                wechatApi.batchMaterial({
                    type:'voice',
                    offset:0,
                    count:10
                }),
                wechatApi.batchMaterial({
                    type:'news',
                    offset:0,
                    count:10
                })
            ]
            console.log(results)
            reply = JSON.stringify(results);
        }else if(content === '12'){
            var tag = yield wechatApi.createTag('tag5');
            console.log(tag);

            var tags = yield wechatApi.fetchTag()
            console.log(tags);

            var updateTag = yield wechatApi.updateTag(tag.tag.id,'tag14')
            
            console.log('update',updateTag);
            
            var delTag = yield wechatApi.deleteTag(tag.tag.id);
            var tags = yield wechatApi.fetchTag()
            console.log(tags);
            reply = 'tag test done'
        }
        this.body = reply;
    }

    yield next;
}