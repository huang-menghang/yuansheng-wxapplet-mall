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
      page:1,
      pageSize:4,
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
          console.log("code:" + res.data.code);
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
        url: app.globalData.serverPath +"/wxapplet/category",
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
            activeCategoryId: 0,
            page:1,
            gooods:[],
            loadingMoreHidden: true
          });
          that.getGoodsList(0);
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
    scroll: function (e) {
      //  console.log(e) ;
      var that = this, scrollTop = that.data.scrollTop;
      that.setData({
        scrollTop: e.detail.scrollTop
      })
      // console.log('e.detail.scrollTop:'+e.detail.scrollTop) ;
      // console.log('scrollTop:'+scrollTop)
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
        activeCategoryId: e.currentTarget.id,
        page:1,
        goods:[],
        loadingMoreHidden: true
      });
      this.getGoodsList(this.data.activeCategoryId);
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
    toDetailsTap: function (e) {
      wx.navigateTo({
        url: '/pages/commodity-info/index?commodityId=' + e.currentTarget.dataset.id
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
    getGoodsList: function (categoryId){
      var that = this;
      console.log("页数:  "+this.data.page);
      wx.request({
        url: app.globalData.serverPath + "/wxapplet/category/" + categoryId +"/commodity",
        data:{
          nameLike: that.data.searchInput,
          pageNum:that.data.page,
          pageSize:that.data.pageSize
        },
        success: function (res) {
          console.log(res);
          var goodslistTem = that.data.goods;
          if (that.data.pageNum == 1){
            goodslistTem = []
          }
          var goodslist = res.data.items;
          if (res.data.lastPage) {
            that.setData({
              goods: goodslistTem.concat(goodslist),
              loadingMoreHidden: false
            })
          } else {
            that.setData({
              goods: goodslistTem.concat(goodslist),
              loadingMoreHidden: true,
              page: that.data.page + 1
            })
          }
        }
      })
    },
    listenerSearchInput: function (e) {
      this.setData({
        searchInput: e.detail.value
      })

    },
    toSearch: function () {
      this.setData({
        page:1,
        goods:[],
        loadingMoreHidden:true
      })
      this.getGoodsList(this.data.activeCategoryId);
    },
    /**
      * 页面相关事件处理函数--监听用户下拉动作
      */
    onPullDownRefresh: function () {
      console.log("下拉");
    },
    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {
      if (this.data.loadingMoreHidden){
          this.getGoodsList(this.data.activeCategoryId);
      }
    }


})
