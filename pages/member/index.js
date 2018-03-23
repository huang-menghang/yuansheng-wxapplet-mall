const app = getApp()

Page({
  data: {
    balance: 0,
    freeze: 0,
    score: 0,
    signInPoints: 0,//用户积分
    signIn:false,//用戶是否签到
  },
  onLoad() {

  },
  onShow() {
    this.getUserInfo();

    this.getUserApiInfo();
    this.getUserAmount();
    this.checkScoreSign();
  },
  getUserInfo: function (cb) {
    var that = this
    wx.login({
      success: function () {
        wx.getUserInfo({
          success: function (res) {
            that.setData({
              userInfo: res.userInfo
            });
          }
        })
      }
    })
  },
  aboutUs: function () {
    wx.showModal({
      title: '关于我们',
      content: '本系统基于开源小程序商城系统 https://github.com/EastWorld/wechat-app-mall 搭建，祝大家使用愉快！',
      showCancel: false
    })
  },
  getPhoneNumber: function (e) {
    if (!e.detail.errMsg || e.detail.errMsg != "getPhoneNumber:ok") {
      wx.showModal({
        title: '提示',
        content: '无法获取手机号码',
        showCancel: false
      })
      return;
    }
    var that = this;
    wx.request({
      url: 'https://api.it120.cc/' + app.globalData.subDomain + '/user/wxapp/bindMobile',
      data: {
        token: app.globalData.token,
        encryptedData: e.detail.encryptedData,
        iv: e.detail.iv
      },
      success: function (res) {
        if (res.data.code == 0) {
          wx.showToast({
            title: '绑定成功',
            icon: 'success',
            duration: 2000
          })
          that.getUserApiInfo();
        } else {
          wx.showModal({
            title: '提示',
            content: '绑定失败',
            showCancel: false
          })
        }
      }
    })
  },
  getUserApiInfo: function () {
    var that = this;
    wx.request({
      url: 'https://api.it120.cc/' + app.globalData.subDomain + '/user/detail',
      data: {
        token: app.globalData.token
      },
      success: function (res) {
        if (res.data.code == 0) {
          that.setData({
            apiUserInfoMap: res.data.data,
            userMobile: res.data.data.base.mobile
          });
        }
      }
    })

  },
  getUserAmount: function () {
    var that = this;
    wx.request({
      url: 'https://api.it120.cc/' + app.globalData.subDomain + '/user/amount',
      data: {
        token: app.globalData.token
      },
      success: function (res) {
        if (res.data.code == 0) {
          that.setData({
            balance: res.data.data.balance,
            freeze: res.data.data.freeze,
            score: res.data.data.score
          });
        }
      }
    })

  },
  checkScoreSign: function () {
    var that = this;
    var postData={
      token: app.globalData.token,
      id: app.globalData.appletMemberId
    }
    console.log(postData);
    wx.request({
      url: app.globalData.serverPath + '/wxapplet/member/todaySigned',
      data: postData,
      success: function (res) {
        if (res.statusCode == 200) {
          that.setData({
            signInPoints: res.data[0].signInPoints,
            signIn: res.data[0].signIn
          });
        }
      }
    })
  },
  scoresign: function () {
    var that = this;
    wx.request({
      url: app.globalData.serverPath + '/wxapplet/member/signIn',
      data: {
        token: app.globalData.token,
        signInPoints: 5,
        id: app.globalData.appletMemberId
      },
      method: 'POST',
      header: {
        "content-type": "application/x-www-form-urlencoded",
      },
      success: function (res) {
        if (res.statusCode == 200) {
          // that.getUserAmount();
          that.checkScoreSign();
        } else {
          wx.showModal({
            title: '错误',
            content: "签到失败，请重新签到",
            showCancel: false
          })
        }
      }
    })
  },
  relogin: function () {
    var that = this;
    wx.authorize({
      scope: 'scope.userInfo',
      success() {
        app.globalData.token = null;
        app.login();
        wx.showModal({
          title: '提示',
          content: '重新登陆成功',
          showCancel: false,
          success: function (res) {
            if (res.confirm) {
              that.onShow();
            }
          }
        })
      },
      fail(res) {
        console.log(res);
        wx.openSetting({});
      }
    })
  },
  recharge: function () {
    wx.navigateTo({
      url: "/pages/recharge/index"
    })
  },
  withdraw: function () {
    wx.navigateTo({
      url: "/pages/withdraw/index"
    })
  },
  //查看收货地址
  selectAddress:function(){
    var that = this;
    console.log("ddd")
    wx.chooseAddress({
      success: function (res) {
        
       },
      fail: function (res) { },
      complete: function (res) { },
    })
  },
  //查看优惠券
  selectCoupons:function(){
    console.log("优惠券");
    wx.openCard({
      cardList: [],
    })
  }
})