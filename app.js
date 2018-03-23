//app.js
App({
  onLaunch: function () {
    //获取商店的名称
    //登陆获取token

    // 登录
    // wx.login({
    //   success: res => {
    //     // wx.request({
    //     //   url: 'http://localhost:8080/yuansheng-weixinshop-server/wxapplet/login',
    //     // })
    //     // 发送 res.code 到后台换取 openId, sessionKey, unionId
    //   }
    // })
    this.login();
    // 获取用户信息
    // wx.getSetting({
    //   success: res => {
    //     if (res.authSetting['scope.userInfo']) {
    //       // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
    //       wx.getUserInfo({
    //         success: res => {
    //           // 可以将 res 发送给后台解码出 unionId
    //           this.globalData.userInfo = res.userInfo

    //           // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
    //           // 所以此处加入 callback 以防止这种情况
    //           if (this.userInfoReadyCallback) {
    //             this.userInfoReadyCallback(res)
    //           }
    //         }
    //       })
    //     }
    //   }
    // })
  },
  //登陆
  login:function(){
     var that = this;
     var token = this.globalData.token;
     if(token){
       //检查token是否存在
       console.log("验证token");
       console.log(token);
       wx.request({
         url: that.globalData.serverPath +'/wxapplet/member/checktoken',
         data:{
           token: token
         },
         method:'GET',
         success:function(res){
            if(!res.data.success){
              this.globalData.token = null;
              that.login();
            }
         }
       })
       //验证成功,直接登陆后台
       return ;
     }
     //如果不存在token,则需要
     wx.login({
       success:function(res){
        wx.request({
          url: that.globalData.serverPath +'/wxapplet/member/login',
          data:{code:res.code},
          success:function(res){
           if(res.data.success){
              if (res.data.attributes.token){
                console.log(res.data.attributes.token);
                that.globalData.token = res.data.attributes.token;
                that.globalData.appletMemberId = res.data.attributes.appletMemberId;
             }else{
                that.register();
             }
                return;
           }
           else{
             wx.hideLoading();
             wx.showModal({
               title: '提示',
               content: '无法登录，请重试',
               showCancel: false
             })
                return;
           }


          }
        })



       }
     })
  },
  register:function(){
    var that = this;
    wx.login({
      success:function(res){
      var code = res.code;
      wx.getUserInfo({
        success:function(res){
        //将用户信息注册
        var iv = res.iv;
        var encryptedData = res.encryptedData;
        console.log("注册");
        wx.request({
          url: that.globalData.serverPath+ '/wxapplet/member/register',
          data: { code: code, encryptedData: encryptedData, iv: iv }, // 设置请求的 参数
          success: (res) => {
            console.log(res);
            if(res.data.success){
              that.login();
              wx.hideLoading();
            }
            else{
              wx.showModal({
                title: '提示',
                content: '服务器出现问题',
                showCancel: false
              })
            }
            return ;
          }
        })

        }
      })
      }
    })
  },
  globalData: {
    userInfo: null,
    serverPath:'http://localhost:8080/yuansheng-weixinshop-server',
    token:null,
    appletMemberId:null
  }
})