// pages/order-info/index.js
var app = getApp();
Page({
  data: {
    orderId: 0,
    goodsList: [],
    orderInfo:{},
    yunPrice: "0.00"
  },
  onLoad: function (e) {
    var orderId = e.id;
    this.data.orderId = orderId;
    this.setData({
      orderId: orderId
    });
  },
  onShow: function () {
    var that = this;
    var id = that.data.orderId;
    wx.request({
      url: app.globalData.serverPath + '/wxapplet/payOrder/' + id,
      data: {
        token: app.globalData.token
      },
      success: (res) => {
        wx.hideLoading(); 
        if (!res.data[0]) {
          wx.showModal({
            title: '错误',
            content: "该订单不存在!",
            showCancel: false
          })
          return;
        }
        that.setData({
          orderInfo: res.data[0]
        });
      }
    });
    var allprice = 0;
    var goodsList = this.data.goodsList;
    for (var i = 0; i < goodsList.length; i++) {
      allprice += parseFloat(goodsList[0].price) * goodsList[0].number;
    }
    this.setData({
      allGoodsPrice: allprice
    });
  },

  confirmBtnTap: function (e) {
    let that = this;
    let orderId = this.data.orderId;
    let formId = e.detail.formId;
    wx.showModal({
      title: '确认您已收到商品？',
      content: '',
      success: function (res) {
        if (res.confirm) {
          wx.showLoading();
          wx.request({
            url: app.globalData.serverPath + '/wxapplet/payOrder/delivery',
            data: {
              token: app.globalData.token,
              id: orderId
            },
            success: (res) => {
              if (res.data.success) {
                that.onShow();

              }else{
                wx.showModal({
                  title: '提示',
                  content: res.data.msg,
                })
              }
            }
          })
        }
      }
    })
  },
  submitReputation: function (e) {
    let that = this;
    let formId = e.detail.formId;
    let postJsonString = {};
    postJsonString.token = app.globalData.token;
    postJsonString.appletMemberId = app.globalData.appletMember.id;
    postJsonString.id = this.data.orderId;
    let comments = "";
    let i = 0;
    while (e.detail.value["orderGoodsId" + i]) {
      let commodityId = e.detail.value["orderGoodsId" + i];
      let level = e.detail.value["goodReputation" + i];
      let commentContent = e.detail.value["goodReputationRemark" + i];
      
      let comment = '{' + '"commodityId":' + commodityId + ',"level":' + level + ',"commentContent":"' + commentContent + '"}';
      comments += comment;
      let j = i+1;
      if (e.detail.value["orderGoodsId" + j]){
        comments += ";"
      }
      i++;
    }
    postJsonString.comments = comments;
    wx.showLoading();
    wx.request({
      url: app.globalData.serverPath + '/wxapplet/payOrder/comment',
      data: postJsonString,
      method:"POST",
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      success: (res) => {
        wx.hideLoading();
        if (res.data.success) {
          that.onShow()
        }else{
          wx.showModal({
            title: '提示',
            content: res.data.msg,
          })
        }
      }
    })
  }
})