'use strict';

module.exports = {
    'button':[{
        'name':'点击事件',
        'type':'click',
        'key':'menu_click'
    },{
        'name':'点击菜单',
        'sub_button':[{
            'type':'view',
            'name':'跳转URL',
            'url':'http://bing.cn'
        },{
            'type':'scancode_push',
            'name':'扫码推送',
            'key':'qr_scan',
        },{
            'name':'扫码推送中。。。',
            'type':'scancode_waitmsg',
            'key':'qr_scan_waitmsg',
        },{
            'name':'弹出系统拍照',
            'type':'pic_sysphoto',
            'key':'pic_photo',
        },{
            'name':'弹出拍照or相册发图',
            'type':'pic_photo_or_album',
            'key':'pic_photo_or_album',
        }]
    },{
        'name':'点出菜单2',
        'sub_button':[{
            'name':'弹出相册发图器',
            'type':'pic_weixin',
            'key':'pic_weixin',
        },{
            'name':'地理位置',
            'type':'location_select',
            'key':'location_select'
        }
        // ,{
        //     'name':'下发图片消息',
        //     'type':'media_id',
        //     'media_id':'xxxx'
        // },{
        //     'name':'跳转图文消息的URL',
        //     'type':'view_limited',
        //     'media_id':'xxx'
        // }
    ]
    }]
}