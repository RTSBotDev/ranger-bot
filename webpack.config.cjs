const path = require('path');

module.exports = {
  entry: './main.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts'],
  },
  output: {
    filename: 'compiled.js',
    path: path.resolve(__dirname, 'dist'),
  },
  mode: 'none',
};
