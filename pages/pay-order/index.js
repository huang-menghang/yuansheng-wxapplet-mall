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
    // yunPrice: 0,
    // allGoodsAndYunPrice: 0,
    goodsJsonStr: "",
    orderType: "", //订单类型，购物车下单或立即支付下单，默认是购物车，

    curAddressData: {},

    hasNoCoupons: true,
    coupons: [],
    youhuijine: 0, //优惠券金额
    curCoupon: null, // 当前选择使用的优惠券
    payPrice: 0,
    fullReduction:true,//满减条件是否成立
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
      remarks: remark,
      payPrice: that.data.payPrice,
      appletMemberId: app.globalData.appletMember.id,
      discount: that.data.youhuijine
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
      postData.expressAddressId = that.data.curAddressData.id;
    };
    wx.request({
      url: app.globalData.serverPath + '/wxapplet/payOrder',
      method: 'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      data: postData, // 设置请求的 参数
      success: (res) => {
        var payOrder = res.data[0];
        wx.hideLoading();
        if (res.data.success != null && !res.data.success) {
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
            allGoodsPrice: res.data.data.amountTotle
          });
          
          return;
        };
        wx.redirectTo({
          url: "/pages/order-list/index"
        });
      }
    })
  },

  initShippingAddress: function () {
    var that = this;
    console.log("userInfo" + app.globalData.userInfo);
    var id = app.globalData.appletMember.id;
    wx.request({
      url: app.globalData.serverPath + '/wxapplet/address/' + id,
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
    var goodsJsonStr = "";
    var isNeedLogistics = 0;
    var allGoodsPrice = 0;

    for (let i = 0; i < goodsList.length; i++) {
      let carShopBean = goodsList[i];
      allGoodsPrice += carShopBean.commodityPrice * carShopBean.number;

      var goodsJsonStrTmp = '';
      if (i > 0) {
        goodsJsonStrTmp = ",";
      }

      goodsJsonStrTmp += '{"commodityId":' + carShopBean.commodityId + ';"commodityNumber":' + carShopBean.number + ';"specationId":' + carShopBean.specation.id + ';"commodityPrice":' + carShopBean.specation.commodityPrice + '}';
      goodsJsonStr += goodsJsonStrTmp;
      console.log("goodsJsonStrTmp" + i + ":" + goodsJsonStrTmp);
    }
    that.setData({
      isNeedLogistics: 1,
      allGoodsPrice: allGoodsPrice,
      payPrice: allGoodsPrice - that.data.youhuijine,
      goodsJsonStr: goodsJsonStr
    })
    that.getCoupons();
  },

  addAddress: function () {
    var that = this
    wx.chooseAddress({
      success: function (res) {
        var provinceName = res.provinceName;
        var cityName = res.cityName;
        var diatrictName = res.countyName;
        var address = res.detailInfo;
        var mobile = res.telNumber;
        var consignee = res.userName;
        console.log("consignee:" + consignee);
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
            consignee: consignee,
            appletMemberId: app.globalData.appletMember.id
          },
          dataType: "json",
          success: function (res) {
            if (res.data.success != null && !res.data.success) {
              wx.showModal({
                title: '提示',
                content: res.data.msg,
              })
            } else {
              console.log("地址ID:" + res.data[0].id);
              that.setData({
                curAddressData: res.data[0]
              })
            }
          }
        })
      }
    })
  },
  selectAddress: function () {
    var that = this
    console.log("选择地址")
    wx.chooseAddress({
      success: function (res) {
        var provinceName = res.provinceName;
        var cityName = res.cityName;
        var diatrictName = res.countyName;
        var address = res.detailInfo;
        var mobile = res.telNumber;
        var consignee = res.userName;
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
            consignee: consignee,
            appletMemberId: app.globalData.appletMember.id
          },
          dataType: "json",
          success: function (res) {
            if (res.data.success != null && !res.data.success) {
              wx.showModal({
                title: '提示',
                content: res.data.msg,
              })
            } else {
              console.log("地址ID:" + res.data[0].id);
              that.setData({
                curAddressData: res.data[0]
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
      url: app.globalData.serverPath + '/wxapplet/coupon/use',
      data: {
        token: app.globalData.token,
        status: 0,
        totalePrice: that.data.allGoodsPrice
      },
      success: function (res) {
        if (res.statusCode == 200){

          that.setData({
            hasNoCoupons:false,
            coupons:res.data
          });
        };
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
    if (this.data.allGoodsPrice >= this.data.coupons[selIndex].moneyHreshold){
      let payPrice = this.data.allGoodsPrice - this.data.coupons[selIndex].moneyReduce;
      this.setData({
        youhuijine: this.data.coupons[selIndex].moneyReduce,
        curCoupon: this.data.coupons[selIndex],
        payPrice: payPrice,
        fullReduction:true
      });
    }else{
      this.setData({
        youhuijine: 0,
        curCoupon: null,
        fullReduction:false
      });
    }
  }
})