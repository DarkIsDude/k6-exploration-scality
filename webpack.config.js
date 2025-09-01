const path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    index: './src/index.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'commonjs',
    filename: '[name].bundle.js',
  },
  module: {
    rules: [
      { test: /\.ts$/, use: 'ts-loader', exclude: /node_modules/ },
      { test: /\.js$/, use: 'babel-loader' },
    ],
  },
  resolve: { extensions: ['.ts', '.js'] },
  target: 'web',
  externals: /k6(\/.*)?/,
};
