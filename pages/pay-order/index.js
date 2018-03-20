// pages/pay-order/index.js
var app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    goodsList: [],
    isNeedLogistics: 0, // 是否需要物流信息
    allGoodsPrice: 0,
    yunPrice: 0,
    allGoodsAndYunPrice: 0,
    goodsJsonStr: "",
    orderType: "", //订单类型，购物车下单或立即支付下单，默认是购物车，

    curAddressData:{},

    hasNoCoupons: true,
    coupons: [],
    youhuijine: 0, //优惠券金额
    curCoupon: null, // 当前选择使用的优惠券
    payPrice:0,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (e) {
    var that = this;
    //显示收货地址标识
    that.setData({
      isNeedLogistics: 1,
      orderType: e.orderType
    });
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    var that = this;
    var shopList = [];
    //立即购买下单
    if ("buyNow" == that.data.orderType) {
      var buyNowInfoMem = wx.getStorageSync('buyNowInfo');

      if (buyNowInfoMem && buyNowInfoMem.shopList) {
        shopList = buyNowInfoMem.shopList
      }
    } else {
      //购物车下单
      var shopCarInfoMem = wx.getStorageSync('shopCarInfo');
      if (shopCarInfoMem && shopCarInfoMem.shopList) {
        shopList = shopCarInfoMem.shopList.filter(entity => {
          return entity.active;
        });
      }
    };
    that.setData({
      goodsList: shopList,
    });
    that.initShippingAddress();
  },

  getDistrictId: function (obj, aaa) {
    if (!obj) {
      return "";
    }
    if (!aaa) {
      return "";
    }
    return aaa;
  },

  createOrder: function (e) {
    wx.showLoading();
    var that = this;
    var loginToken = app.globalData.token // 用户登录 token
    var remark = ""; // 备注信息
    if (e) {
      remark = e.detail.value.remark; // 备注信息
    }

    var postData = {
      token: loginToken,
      goodsJsonStr: that.data.goodsJsonStr,
      remark: remark
    };
    if (that.data.isNeedLogistics > 0) {
      if (!that.data.curAddressData) {
        wx.hideLoading();
        wx.showModal({
          title: '错误',
          content: '请先设置您的收货地址！',
          showCancel: false
        })
        return;
      }
      postData.addressId = that.data.curAddressData.id;
    }
    if (that.data.curCoupon) {
      postData.couponId = that.data.curCoupon.id;
    }
    if (!e) {
      postData.calculate = "true";
    };
    wx.request({
      url: app.globalData.serverPath + '/order',
      method: 'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      data: postData, // 设置请求的 参数
      success: (res) => {
        wx.hideLoading();
        if (res.data.code != 0) {
          wx.showModal({
            title: '错误',
            content: res.data.msg,
            showCancel: false
          })
          return;
        }

        if (e && "buyNow" != that.data.orderType) {
          // 清空购物车数据
          wx.removeStorageSync('shopCarInfo');
        }
        if (!e) {
          that.setData({
            isNeedLogistics: res.data.data.isNeedLogistics,
            allGoodsPrice: res.data.data.amountTotle,
            allGoodsAndYunPrice: res.data.data.amountLogistics + res.data.data.amountTotle,
            yunPrice: res.data.data.amountLogistics
          });
          that.getCoupons();
          return;
        }
        // 配置模板消息推送
        var postJsonString = {};
        postJsonString.keyword1 = { value: res.data.data.dateAdd, color: '#173177' }
        postJsonString.keyword2 = { value: res.data.data.amountReal + '元', color: '#173177' }
        postJsonString.keyword3 = { value: res.data.data.orderNumber, color: '#173177' }
        postJsonString.keyword4 = { value: '订单已关闭', color: '#173177' }
        postJsonString.keyword5 = { value: '您可以重新下单，请在30分钟内完成支付', color: '#173177' }
        app.sendTempleMsg(res.data.data.id, -1,
          'mGVFc31MYNMoR9Z-A9yeVVYLIVGphUVcK2-S2UdZHmg', e.detail.formId,
          'pages/index/index', JSON.stringify(postJsonString));
        postJsonString = {};
        postJsonString.keyword1 = { value: '您的订单已发货，请注意查收', color: '#173177' }
        postJsonString.keyword2 = { value: res.data.data.orderNumber, color: '#173177' }
        postJsonString.keyword3 = { value: res.data.data.dateAdd, color: '#173177' }
        app.sendTempleMsg(res.data.data.id, 2,
          'Arm2aS1rsklRuJSrfz-QVoyUzLVmU2vEMn_HgMxuegw', e.detail.formId,
          'pages/order-details/index?id=' + res.data.data.id, JSON.stringify(postJsonString));
        // 下单成功，跳转到订单管理界面
        wx.redirectTo({
          url: "/pages/order-list/index"
        });
      }
    })
  },

  initShippingAddress: function () {
    var that = this;
    wx.request({
      url: app.globalData.serverPath + '/wxapplet/address/2',
      data: {
        token: app.globalData.token
      },
      success: (res) => {

        if (res.data[0]) {
          that.setData({
            curAddressData: res.data[0]
          });
        } else {
          that.setData({
            curAddressData: null
          });
        }
        that.totlePrice();
      }
    })
  },
  //商品总价格
  totlePrice: function () {
    var that = this;
    var goodsList = this.data.goodsList;
    var goodsJsonStr = "[";
    var isNeedLogistics = 0;
    var allGoodsPrice = 0;

    for (let i = 0; i < goodsList.length; i++) {
      let carShopBean = goodsList[i];
      allGoodsPrice += carShopBean.commodityPrice * carShopBean.number;
    }
    that.setData({
      isNeedLogistics: 1,
      allGoodsPrice: allGoodsPrice,
      payPrice: allGoodsPrice - that.data.youhuijine,
    });
    that.createOrder();
  },

  addAddress: function () {
    var that = this;
    console.log("選擇地址")
    wx.chooseAddress({
      success: function (res) {
        var provinceName = res.provinceName;
        var cityName = res.cityName;
        var diatrictName = res.countyName;
        var address = res.detailInfo;
        var mobile = res.telNumber;
        var nickname = res.userName;
        console.log("res:" + res);
        wx.request({
          url: app.globalData.serverPath + '/wxapplet/address',
          method: "POST",
          header: {
            'content-type': 'application/x-www-form-urlencoded'
          },
          data: {
            provinceName: provinceName,
            cityName: cityName,
            diatrictName: diatrictName,
            address: address,
            mobile: mobile,
            nickname: nickname,
          },
          dataType: "json",
          success: function (res) {
            if(res.data.success){
              wx.showModal({
                title: '提示',
                content: res.data.msg,
              })
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
  },
  selectAddress: function () {
    // wx.navigateTo({
    //   url: "/pages/select-address/index"
    // })
    var that = this;
    console.log("選擇地址")
    wx.chooseAddress({
      success: function (res) {
        var provinceName = res.provinceName;
        var cityName = res.cityName;
        var diatrictName = res.countyName;
        var address = res.detailInfo;
        var mobile = res.telNumber;
        var nickname = res.userName;
        wx.request({
          url: app.globalData.serverPath + '/wxapplet/address',
          method:"POST",
          header: {
            'content-type': 'application/x-www-form-urlencoded'
          },
          data:{
            provinceName: provinceName,
            cityName: cityName,
            diatrictName: diatrictName,
            address: address,
            mobile: mobile,
            nickname: nickname,
          },
          dataType:"json",
          success:function(res){
            console.log("res:" + res.data.success);
            
            if (res.data.success) {
              console.log("res:" + res.data.msg);
              wx.showModal({
                title: '提示',
                content: res.data.msg,
              })
            } else {
              wx.showModal({
                title: '提示',
                content: res.data.msg,
              })
            }
          }
        })
      }
    })  

  },
  getCoupons: function () {
    var that = this;
    wx.request({
      url: 'https://api.it120.cc/' + app.globalData.subDomain + '/discounts/my',
      data: {
        token: app.globalData.token,
        status: 0
      },
      success: function (res) {
        if (res.data.code == 0) {
          var coupons = res.data.data.filter(entity => {
            return entity.moneyHreshold <= that.data.allGoodsAndYunPrice;
          });
          if (coupons.length > 0) {
            that.setData({
              hasNoCoupons: false,
              coupons: coupons
            });
          }
        }
      }
    })
  },
  bindChangeCoupon: function (e) {
    const selIndex = e.detail.value[0] - 1;
    if (selIndex == -1) {
      this.setData({
        youhuijine: 0,
        curCoupon: null
      });
      return;
    }
    this.setData({
      youhuijine: this.data.coupons[selIndex].money,
      curCoupon: this.data.coupons[selIndex]
    });
  }
})