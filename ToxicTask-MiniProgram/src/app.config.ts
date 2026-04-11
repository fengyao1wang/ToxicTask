export default {
  pages: [
    'pages/index/index',
    'pages/auth/index',
    'pages/tasks/create',
    'pages/tasks/contract',
    'pages/tasks/detail',
    'pages/shame/index',
    'pages/profile/index',
    'pages/checkin/index',
    'pages/achievements/index',
    'pages/social/index'
  ],
  tabBar: {
    color: '#666',
    selectedColor: '#ff3b30',
    backgroundColor: '#1a1a1a',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '打卡',
        iconPath: 'assets/tab-home.png',
        selectedIconPath: 'assets/tab-home-active.png'
      },
      {
        pagePath: 'pages/shame/index',
        text: '耻辱墙',
        iconPath: 'assets/tab-shame.png',
        selectedIconPath: 'assets/tab-shame-active.png'
      },
      {
        pagePath: 'pages/profile/index',
        text: '资产',
        iconPath: 'assets/tab-profile.png',
        selectedIconPath: 'assets/tab-profile-active.png'
      }
    ]
  },
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1a1a1a',
    navigationBarTitleText: '今天又鸽了',
    navigationBarTextStyle: 'white',
    backgroundColor: '#0a0a0a'
  }
}
