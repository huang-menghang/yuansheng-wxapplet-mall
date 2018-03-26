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
    var that = this;
    console.log(e)
    var id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '提示',
      content: '确定要取消该订单吗？',
      success: function (res) {
        if (res.confirm) {
          wx.showLoading();
          console.log("token:" + app.globalData.token)
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
    console.log(app.globalData.appletMember);
    wx.request({
      url: app.globalData.serverPath + '/wxapplet/payOrder/wxPay',
      data: {
        token: app.globalData.token,
        payPrice: money,
        id: orderId,
        appletMemberId: app.globalData.appletMember.id
      },
      success: function (res) {
        // if (res.data.code == 0) {
        //   // res.data.data.balance
        //   money = money - res.data.data.balance;
        //   if (money <= 0) {
        //     // 直接使用余额支付
        //     wx.request({
        //       url: 'https://api.it120.cc/' + app.globalData.subDomain + '/order/pay',
        //       method: 'POST',
        //       header: {
        //         'content-type': 'application/x-www-form-urlencoded'
        //       },
        //       data: {
        //         token: app.globalData.token,
        //         orderId: orderId
        //       },
        //       success: function (res2) {
        //         wx.reLaunch({
        //           url: "/pages/order-list/index"
        //         });
        //       }
        //     })
        //   } else {
        //     wxpay.wxpay(app, money, orderId, "/pages/order-list/index");
        //   }
        // } else {
        //   wx.showModal({
        //     title: '错误',
        //     content: '无法获取用户资金信息',
        //     showCancel: false
        //   })
        // }
      }
    })
  },
  onLoad: function (options) {
    // 生命周期函数--监听页面加载

  },
  onReady: function () {
    // 生命周期函数--监听页面初次渲染完成

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
    postData.status = that.data.currentType;
    console.log("订单状态：" + that.data.currentType);
    wx.request({
      url: app.globalData.serverPath + '/wxapplet/payOrder',
      data: postData,
      success: (res) => {
        wx.hideLoading();
        var payOrderList = that.data.orderList;
        console.log(payOrderList);
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

  onHide: function () {
    // 生命周期函数--监听页面隐藏

  },
  onUnload: function () {
    // 生命周期函数--监听页面卸载
    
  },
  onPullDownRefresh: function () {
    // 页面相关事件处理函数--监听用户下拉动作

  },
  // 页面上拉触底事件的处理函数
  onReachBottom: function () {
    if (this.data.loadingMoreHidden){
      this.getPayOrdersList();
    }
  }
})