const path = require('path');
const APP = path.join(__dirname, 'app');
const BUILD = path.join(__dirname, 'build');
const webpack = require('webpack');

module.exports = {
  entry: {
    js: path.join(APP, 'index.js'),
    html: path.join(APP, 'index.html')
  },
  output: {
    path: BUILD,
    filename: 'bundle.js'
  },
  module: {
    loaders: [{
      test: /\.js$/,
      loaders: [
        'babel-loader',
        'eslint-loader'
      ]
    }, {
      test: /\.html$/,
      loader: 'file?name=[name].[ext]'
    }, {
      test: /\.css$/,
      loaders: ['style-loader', 'css-loader?importLoaders=1']
    }, {
      test: /\.json/,
      loader: 'json-loader'
    }, {
      test: /\.(png|jpg|svg|ttf)$/,
      loader: 'url?limit=80000'
    }]
  },
  devtool: 'evil-source-map',
  devServer: {
    contentBase: BUILD,
    inline: true,
    progress: true,
    stats: { color: true },
    port: 8080
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery'
    })
  ]
};
