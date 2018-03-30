//index.js
//获取应用实例
var app = getApp()
Page({
  data: {
    coupons: []
  },
  onLoad: function () {
  },
  onShow: function () {
    this.getMyCoupons();
  },
  getMyCoupons: function () {
    var that = this; 
    wx.request({
      url: app.globalData.serverPath + '/wxapplet/coupon',
      data: {
        type: ''
      },
      success: function (res) {
        if (res.data) {
          that.setData({
            hasNoCoupons: false,
            coupons: res.data
          });
        }
      }
    })
  },
  goBuy: function () {
    wx.reLaunch({
      url: '/pages/index/index'
    })
  }

})
