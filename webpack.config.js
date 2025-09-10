const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: {
    index: './src/index.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'commonjs',
    filename: '[name].js',
  },
  module: {
    rules: [
      { test: /\.ts$/, use: 'ts-loader', exclude: /node_modules/ },
      { test: /\.js$/, use: 'babel-loader' },
    ],
  },
  stats: {
    colors: true,
  },
  resolve: { extensions: ['.ts', '.js'] },
  plugins: [new CleanWebpackPlugin()],
  externals: /^(k6|https?\:\/\/)(\/.*)?/,
};
