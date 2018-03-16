// pages/commodity-info/commodity-info.js
var app = getApp();
var WxParse = require('../../wxParse/wxParse.js');

Page({
  data: {
    autoplay: true,
    interval: 3000,
    duration: 1000,
    commodityName:"",
    commodity:{},
    commoditySpecations:{},
    selectSpecation:{},
    commodityPrice:0,
    swiperImagePath:{},
    showImagePath:"",
    swiperCurrent: 0,
    hasMoreSelect: false,
    selectSize: "选择：规格",
    shopNum: 0,
    hideShopPopup: true,
    buyNumber: 0,
    buyNumMin: 1,
    buyNumMax: 0,

    propertyChildIds: "",
    propertyChildNames: "",
    canSubmit: false, //  选中规格尺寸时候是否允许加入购物车
    shopCarInfo: {},
    shopType: "addShopCar",//购物类型，加入购物车或立即购买，默认为加入购物车
  },

  //事件处理函数
  swiperchange: function (e) {
    //console.log(e.detail.current)
    this.setData({
      swiperCurrent: e.detail.current
    })
  },
  onLoad: function (e) {
    if (e.inviter_id) {
      wx.setStorage({
        key: 'inviter_id_' + e.id,
        data: e.inviter_id
      })
    }
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
    })
    wx.request({
      url: app.globalData.serverPath +'/wxapplet/commodity/'+e.commodityId,
      success: function (res) {
        console.log(res.data[0].imagePathMap.carouselImagePaths)
        that.setData({
          hasMoreSelect: true,
          commoditySpecations: res.data[0].commoditySpecations,
          commodity:res.data[0],
          commodityPrice: res.data[0].commodityPriceMin,
          swiperImagePath: res.data[0].imagePathMap.carouselImagePaths,
          showImagePath: res.data[0].imagePathMap.showImagePath[0],
        });
        WxParse.wxParse('article', 'html', '<div class="color:red;">数据不能为空</div>', that, 5);
      }
    })
  },
  goShopCar: function () {
    wx.reLaunch({
      url: "/pages/shop-cart/shop-cart"
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
    if (this.data.buyNumber==0){
      wx.showModal({
        title: '提示',
        content: '请优先选择商品规格！',
        showCancel: false
      })
    }else{
      if (this.data.buyNumber > this.data.buyNumMin) {
        var currentNum = this.data.buyNumber;
        currentNum--;
        this.setData({
          buyNumber: currentNum
        })
      }
    }
  },
  numJiaTap: function () {
    if (this.data.buyNumber == 0) {
      wx.showModal({
        title: '提示',
        content: '请优先选择商品规格！',
        showCancel: false
      })
    } else {
      if (this.data.buyNumber < this.data.buyNumMax) {
        var currentNum = this.data.buyNumber;
        currentNum++;
        this.setData({
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
    that.data.commoditySpecations[e.currentTarget.dataset.specationindex].active=true;
    // 获取所有的选中规格尺寸数据
    var curSelectNum = 0;
    var canSubmit = false;
    for (var i = 0; i < that.data.commoditySpecations.length; i++) {
      if (that.data.commoditySpecations[i].active){
        curSelectNum++
        break;
      }
    }
    if(curSelectNum == 1){
      canSubmit = true;
    }

    if(canSubmit){
      that.setData({
        selectSpecation: that.data.commoditySpecations[e.currentTarget.dataset.specationindex],
        buyNumMax: that.data.commoditySpecations[e.currentTarget.dataset.specationindex].commoditySpecationStock,
        buyNumber: (that.data.commoditySpecations[e.currentTarget.dataset.specationindex].commoditySpecationStock>0)?1:0
      });
    }

    this.setData({
      commodityPrice: that.data.commoditySpecations[e.currentTarget.dataset.specationindex].commodityPrice,
      commoditySpecations: that.data.commoditySpecations,
      canSubmit: canSubmit,
    })
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
  }
})