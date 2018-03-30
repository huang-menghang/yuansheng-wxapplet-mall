// pages/commodity-info/index.js
var app = getApp();
var WxParse = require('../../wxParse/wxParse.js');

Page({
  data: {
    autoplay: true,
    interval: 3000,
    duration: 1000,
    commodityName: "",
    commodity: {},
    commoditySpecations: {},
    selectSpecation: {},
    commodityPrice: 0,
    commodityIntroduceContent:"",
    swiperImagePath: {},
    showImagePath: "",
    swiperCurrent: 0,
    hasMoreSelect: false,
    selectSize: "选择：规格",
    shopNum: 0,
    hideShopPopup: true,
    buyNumber: 0,
    buyNumMin: 1,
    buyNumMax: 0,
    canSubmit: false, //  选中规格尺寸时候是否允许加入购物车
    shopCarInfo: {},
    comments:{},
    shopType: "addShopCar",//购物类型，加入购物车或立即购买，默认为加入购物车
  },

  //事件处理函数
  swiperchange: function (e) {
    this.setData({
      swiperCurrent: e.detail.current
    })
  },
  onLoad: function (e) {
    var that = this;
    // 获取购物车数据
    wx.getStorage({
      key: 'shopCarInfo',
      success: function (res) {
        that.setData({
          shopCarInfo: res.data,
          shopNum: res.data.shopNum
        });
      }
    });
    wx.request({
      url: app.globalData.serverPath + '/wxapplet/commodity/' + e.commodityId,
      success: function (res) {
        console.log("res:" + res.statusCode);
        if (res.statusCode == 200){
          console.log(res.data[0].comments.length)
          that.setData({
            hasMoreSelect: true,
            commoditySpecations: res.data[0].commoditySpecations,
            commodity: res.data[0],
            comments: res.data[0].comments,
            commodityPrice: res.data[0].commodityPriceMin,
            swiperImagePath: res.data[0].imagePathMap.carouselImagePaths,
            showImagePath: res.data[0].imagePathMap.showImagePath[0],
            commodityIntroduceContent: that.getCommodityIntroduceContent(res.data[0].imagePathMap.infoImagePaths),
          });
        }else{
          wx.showModal({
            title: '提示',
            content: '该商品不存在，请重新选则商品！',
            showCancel: false
          })
        }
        WxParse.wxParse('article', 'html', that.data.commodityIntroduceContent, that, 5);
      }
    })
  },
  goShopCar: function () {
    wx.reLaunch({
      url: "/pages/shop-cart/index"
    });
  },
  toAddShopCar: function () {
    this.setData({
      shopType: "addShopCar"
    })
    this.bindGuiGeTap();
  },
  tobuy: function () {
    this.setData({
      shopType: "tobuy"
    });
    this.bindGuiGeTap();
  },
  /**
   * 规格选择弹出框
   */
  bindGuiGeTap: function () {
    this.setData({
      hideShopPopup: false
    })
  },
  /**
   * 规格选择弹出框隐藏
   */
  closePopupTap: function () {
    this.setData({
      hideShopPopup: true
    })
  },
  numJianTap: function () {
    var that = this;
    if (that.data.buyNumber == 0) {
      if (that.data.canSubmit) {
        wx.showModal({
          title: '提示',
          content: '商品库存不足！',
          showCancel: false
        })
      } else {
        wx.showModal({
          title: '提示',
          content: '请优先选择商品规格！',
          showCancel: false
        })
      }
    } else {
      if (that.data.buyNumber > that.data.buyNumMin) {
        var currentNum = that.data.buyNumber;
        currentNum--;
        that.setData({
          buyNumber: currentNum
        })
      }
    }
  },
  numJiaTap: function () {
    var that = this;
    if (that.data.buyNumber == 0) {
      if (that.data.canSubmit){
        wx.showModal({
          title: '提示',
          content: '商品库存不足！',
          showCancel: false
        })
      }else{
        wx.showModal({
          title: '提示',
          content: '请优先选择商品规格！',
          showCancel: false
        })
      }
    } else {
      if (that.data.buyNumber < that.data.buyNumMax) {
        var currentNum = that.data.buyNumber;
        currentNum++;
        that.setData({
          buyNumber: currentNum
        })
      }
    }
  },
  labelItemTap: function (e) {
    var that = this;
    // 取消所有规格的选中状态
    for (var i = 0; i < that.data.commoditySpecations.length; i++) {
      that.data.commoditySpecations[i].active = false;
    }
    // 设置当前选中状态
    that.data.commoditySpecations[e.currentTarget.dataset.specationindex].active = true;
    // 获取所有的选中规格尺寸数据
    var curSelectNum = 0;
    var canSubmit = false;
    for (var i = 0; i < that.data.commoditySpecations.length; i++) {
      if (that.data.commoditySpecations[i].active) {
        curSelectNum++
        break;
      }
    }
    if (curSelectNum == 1) {
      canSubmit = true;
    }

    if (canSubmit) {
      that.setData({
        selectSpecation: that.data.commoditySpecations[e.currentTarget.dataset.specationindex],
        buyNumMax: that.data.commoditySpecations[e.currentTarget.dataset.specationindex].commoditySpecationStock,
        buyNumber: (that.data.commoditySpecations[e.currentTarget.dataset.specationindex].commoditySpecationStock > 0) ? 1 : 0
      });
    }

    this.setData({
      commodityPrice: that.data.commoditySpecations[e.currentTarget.dataset.specationindex].commodityPrice,
      commoditySpecations: that.data.commoditySpecations,
      canSubmit: canSubmit,
    })
  },
  /**
	  * 立即购买
	  */
  buyNow: function () {
    if (this.data.commodity.commoditySpecations && !this.data.canSubmit) {
      if (!this.data.canSubmit) {
        wx.showModal({
          title: '提示',
          content: '请选择商品规格！',
          showCancel: false
        })
      }
      this.bindGuiGeTap();
      return;
    }
    if (this.data.buyNumber < 1) {
      wx.showModal({
        title: '提示',
        content: '购买数量不能为0！',
        showCancel: false
      })
      return;
    };
    //组建立即购买信息
    var buyNowInfo = this.buliduBuyNowInfo();
    // 写入本地存储
    wx.setStorage({
      key: "buyNowInfo",
      data: buyNowInfo
    })
    this.closePopupTap();

    wx.navigateTo({
      url: "/pages/pay-order/index?orderType=buyNow"
    })
  },
  /**
	 * 组建立即购买信息
	 */
  buliduBuyNowInfo: function () {
    var shopCarMap = {};
    shopCarMap.commodityId = this.data.commodity.id;
    shopCarMap.showImagePath = this.data.showImagePath;
    shopCarMap.commodityName = this.data.commodity.commodityName;
    shopCarMap.commodityPrice = this.data.commodityPrice;
    shopCarMap.specation = this.data.selectSpecation;
    shopCarMap.left = "";
    shopCarMap.active = true;
    shopCarMap.number = this.data.buyNumber;

    var buyNowInfo = {};
    if (!buyNowInfo.shopNum) {
      buyNowInfo.shopNum = 0;
    }
    if (!buyNowInfo.shopList) {
      buyNowInfo.shopList = [];
    }
    buyNowInfo.shopList.push(shopCarMap);
    return buyNowInfo;
  },
  /**
  * 加入购物车
  */
  addShopCar: function () {
    if (this.data.commodity.commoditySpecations && !this.data.canSubmit) {
      if (!this.data.canSubmit) {
        wx.showModal({
          title: '提示',
          content: '请选择商品规格！',
          showCancel: false
        })
      }
      this.bindGuiGeTap();
      return;
    }
    if (this.data.buyNumber < 1) {
      wx.showModal({
        title: '提示',
        content: '购买数量不能为0！',
        showCancel: false
      })
      return;
    };

    //组建购物车
    var shopCarInfo = this.bulidShopCarInfo();

    this.setData({
      shopCarInfo: shopCarInfo,
      shopNum: shopCarInfo.shopNum
    });

    // 写入本地存储
    wx.setStorage({
      key: "shopCarInfo",
      data: shopCarInfo
    })
    this.closePopupTap();
    wx.showToast({
      title: '加入购物车成功',
      icon: 'success',
      duration: 2000
    })
  },
  /**
   * 组建购物车信息
   */
  bulidShopCarInfo: function () {
    // 加入购物车
    var shopCarMap = {};
    shopCarMap.commodityId = this.data.commodity.id;
    shopCarMap.showImagePath = this.data.showImagePath;
    shopCarMap.commodityName = this.data.commodity.commodityName;
    console.log(this.data.selectSpecation);
    shopCarMap.specation = this.data.selectSpecation;
    shopCarMap.commodityPrice = this.data.commodityPrice;
    shopCarMap.left = "";
    shopCarMap.active = true;
    shopCarMap.number = this.data.buyNumber;

    var shopCarInfo = this.data.shopCarInfo;
    if (!shopCarInfo.shopNum) {
      shopCarInfo.shopNum = 0;
    }
    if (!shopCarInfo.shopList) {
      shopCarInfo.shopList = [];
    }
    var hasSameGoodsIndex = -1;
    for (var i = 0; i < shopCarInfo.shopList.length; i++) {
      var tmpShopCarMap = shopCarInfo.shopList[i];
      if (tmpShopCarMap.commodityId == shopCarMap.commodityId && tmpShopCarMap.specation.id == shopCarMap.specation.id) {
        hasSameGoodsIndex = i;
        shopCarMap.number = shopCarMap.number + tmpShopCarMap.number;
        break;
      }
    }

    shopCarInfo.shopNum = shopCarInfo.shopNum + this.data.buyNumber;
    if (hasSameGoodsIndex > -1) {
      shopCarInfo.shopList.splice(hasSameGoodsIndex, 1, shopCarMap);
    } else {
      shopCarInfo.shopList.push(shopCarMap);
    }
    return shopCarInfo;
  },
  //生成商品介绍
  getCommodityIntroduceContent: function (infoImagePaths){
    var that=this;
    var content="";
    for (var i = 0; i < infoImagePaths.length;i++){
      content = content + '<p><img src="' + infoImagePaths[0] + '" style=""/></p>';
    }
    return content;
  },

  //客服服务
  customerService:function(){
    
  }
})