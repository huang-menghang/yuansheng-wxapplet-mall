// pages/order-list/index.js
var wxpay = require('../../utils/pay.js')
var app = getApp()
Page({
  data: {
    statusType: ["待付款", "待发货", "待收货", "待评价", "已完成"],
    currentType: 1,
    tabClass: ["", "", "", "", ""],
    pageNum: 1,
    pageSize: 5,
    loadingMoreHidden: true,
    orderList:[]
  },
  statusTap: function (e) {
    var curType = e.currentTarget.dataset.index + 1;
    this.data.currentType = curType
    this.setData({
      currentType: curType,
      pageNum: 1,
      orderList:[]
    });
    this.getPayOrdersList();
  },
  orderDetail: function (e) {
    var orderId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: "/pages/order-info/index?id=" + orderId
    })
  },
  cancelOrderTap: function (e) {
    var that = this
    var id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '提示',
      content: '确定要取消该订单吗？',
      success: function (res) {
        if (res.confirm) {
          wx.showLoading()
          wx.request({
            url: app.globalData.serverPath + '/wxapplet/payOrder/' + id + "?token=" + app.globalData.token,
            method: 'delete',
            data: {  },
            success: (res) => {
              wx.hideLoading();
              if (res.data.success) {
                that.onShow();
              }else{
                wx.showModal({
                  title: '提示',
                  content: res.data.msg,
                  showCancel: false
                })
              }
            }
          })
        }
      }
    })
  },
  toPayTap: function (e) {
    var that = this;
    var orderId = e.currentTarget.dataset.id;
    var money = e.currentTarget.dataset.money;
    wx.request({
      url: app.globalData.serverPath + '/wxapplet/payOrder/wxPay',
      data: {
        token: app.globalData.token,
        payPrice: money,
        id: orderId,
        appletMemberId: app.globalData.appletMember.id
      },
      success: function (res) {
        that.doWxPay(res.data[0], orderId)
      }
    })
  },

  doWxPay(params, id) {
    var that = this;
    wx.requestPayment({
      timeStamp: params.timeStamp,
      nonceStr: params.nonceStr,
      package: params.packageValue,
      signType: 'MD5',
      paySign: params.paySign,
      success: function (event) { 
        wx.showToast({
          title: '支付成功',
          icon: 'success',
          duration: 2000
        });
        that.getOrderStatistics();
        that.getPayOrdersList();
      } 
    })
  }, 
  getOrderStatistics: function () {
    var that = this;
    wx.request({
      url: app.globalData.serverPath + '/wxapplet/payOrder/statistics',
      data: { token: app.globalData.token },
      success: (res) => {
        wx.hideLoading();
        if (res.data) {
          var tabClass = that.data.tabClass;
          if (res.data.obligations > 0) {
            tabClass[0] = "red-dot"
          } else {
            tabClass[0] = ""
          }
          if (res.data.waitingForDelivery > 0) {
            tabClass[1] = "red-dot"
          } else {
            tabClass[1] = ""
          }
          if (res.data.waitingForGoods > 0) {
            tabClass[2] = "red-dot"
          } else {
            tabClass[2] = ""
          }
          if (res.data.toBeEvaluated > 0) {
            tabClass[3] = "red-dot"
          } else {
            tabClass[3] = ""
          };

          that.setData({
            tabClass: tabClass,
          });
        }
      }
    })
  },
  onShow: function () {
    // 获取订单列表
    this.setData({
      orderList:[]
    })
    this.getOrderStatistics();
    this.getPayOrdersList();
  },

  getPayOrdersList:function(){
    wx.showLoading();
    var that = this;
    var postData = {
      token: app.globalData.token,
      pageNum: that.data.pageNum,
      pageSize: that.data.pageSize,
      appletMemberId: app.globalData.appletMember.id
    };
    postData.status = that.data.currentType
    wx.request({
      url: app.globalData.serverPath + '/wxapplet/payOrder',
      data: postData,
      success: (res) => {
        wx.hideLoading();
        var payOrderList = that.data.orderList
        if (res.data.items.length > 0){
          if (res.data.lastPage) {
            that.setData({
              orderList: payOrderList.concat(res.data.items),
              loadingMoreHidden: false
            });
          } else {
            that.setData({
              orderList: payOrderList.concat(res.data.items),
              loadingMoreHidden: true,
              pageNum: that.data.pageNum + 1
            });
          };
        }else{
          that.setData({
            orderList: null,
          })
        }
      }
    });
  }, 
  // 页面上拉触底事件的处理函数
  onReachBottom: function () {
    if (this.data.loadingMoreHidden){
      this.getPayOrdersList();
    }
  }
})