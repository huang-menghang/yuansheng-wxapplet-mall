//app.js
App({
  onLaunch: function () {
    this.login();
  },
  //登陆
  login:function(){
     var that = this;
     var token = this.globalData.token;
     if(token){
       //检查token是否存在 
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
                that.globalData.token = res.data.attributes.token;
                that.globalData.appletMember = res.data.attributes.appletMember;
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
        wx.request({
          url: that.globalData.serverPath+ '/wxapplet/member/register',
          data: { code: code, encryptedData: encryptedData, iv: iv }, // 设置请求的 参数
          success: (res) => { 
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
    serverPath: 'http://localhost:8080/yuansheng-weixinshop-server',
    token:null,
    appletMember: null
  }
})