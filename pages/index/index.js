//index.js
//获取应用实例
const app = getApp()

Page({
    data:{
      indicatorDots: true,
      //是否自动播放
      autoplay: true,
      interval: 3000,
      duration: 1000,
      loadingHidden: false, // loading
      userInfo: {},
      swiperCurrent: 0,
      selectCurrent: 0,
      categories: [],
      activeCategoryId: 0,
      goods: [],
      scrollTop: "0",
      loadingMoreHidden: true,
      hasNoCoupons: true,
      coupons: [],
      searchInput: '',
    },
    onLoad: function () {
      var that = this;
      wx.setNavigationBarTitle({
        title: '灵秀工坊',
      })
      wx.request({
        url: app.globalData.serverPath +"/wxapplet/scrollImage",
        success:function(res){
          if (res.data.code == 404){
            wx.showModal({
              title: '提示',
              content: '请在后台添加 banner 轮播图片',
              showCancel: false
            })
         
          }
          else{
            console.log(res.data);
            that.setData({
               banners: res.data
             });
          }
        }
      })
      wx.request({
        url: app.globalData.serverPath +"/wxapplet/commodity/category",
        success: function (res) {
          var categories = [{ id: 0, categoryName: "全部" }];
          console.log(res);
          if (res.statusCode == 200) {
            for (var i = 0; i < res.data.length; i++) {
              categories.push(res.data[i]);
            }
          }
          that.setData({
            categories: categories,
            activeCategoryId: 0
          });
          //that.getGoodsList(0);
        }
      })
      that.getCoupons();
      that.getNotice();
    },
    //轮播事件
    swiperchange: function (e) {
      //console.log(e.detail.current)
      this.setData({
        swiperCurrent: e.detail.current
      })
    },
    tapBanner:function(e){
      console.log(e);
      if(e.currentTarget.dataset.id != null){
        wx.navigateTo({
          url: '/pages/commodity-info/index?commodityId=' + e.currentTarget.dataset.id,
        })
      }
    },
    tabClick: function (e) {
      this.setData({
        activeCategoryId: e.currentTarget.id
      });
      //this.getGoodsList(this.data.activeCategoryId);
    },
    getNotice: function () {
      var that = this;
      wx.request({
        url: app.globalData.serverPath + '/wxapplet/news',
        data: { pageSize: 5 },
        success: function (res) {
          console.log(res);
          if (res.statusCode == 200) {
            console.log(res.data);
            that.setData({
              noticeList: res.data
            });
          }
        }
      })
    },
    getCoupons: function () {
      var that = this;
      console.log("获取优惠卷");
      // wx.request({
      //   url:app.globalData.serverPath+'/wxapplet/coupons',
      //   data: {
      //     type: ''
      //   },
      //   success: function (res) {
      //     if (res.data.code == 0) {
      //       that.setData({
      //         hasNoCoupons: false,
      //         coupons: res.data.data
      //       });
      //     }
      //   }
      // })
    },




})
