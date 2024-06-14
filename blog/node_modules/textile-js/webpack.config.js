const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: path.resolve('./src/index.js'),
  devtool: 'source-map',
  output: {
    path: path.resolve('./lib'),
    filename: 'textile.js',
    library: 'textile',
    libraryTarget: 'umd',
    umdNamedDefine: true,
    globalObject: 'this'
  },
  optimization: {
    minimize: true,
    minimizer: [ new TerserPlugin({ extractComments: false }) ]
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [ [ '@babel/preset-env', {
              targets: {
                browsers: [
                  '>0.25%', 'not op_mini all'
                ]
              }
            } ] ]
          }
        }
      }
    ]
  }
};
