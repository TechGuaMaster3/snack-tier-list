module.exports = {
  productionSourceMap: process.env.NODE_ENV !== 'production',
  transpileDependencies: [
    'vuetify',
  ],
  publicPath: process.env.NODE_ENV === 'production'
    ? './'
    : '/',
  css: {
    loaderOptions: {
      css: {
        url: false,
      },
    },
  },
};
