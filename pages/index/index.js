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
    },
    //轮播事件
    swiperchange: function (e) {
      //console.log(e.detail.current)
      this.setData({
        swiperCurrent: e.detail.current
      })
    },
    tapBanner:function(){

    }




})
