const HtmlPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");

const DIST = __dirname + "/dist";

module.exports = {
  mode: "development",
  context: __dirname + "/src",
  entry: "./index.js",
  output: {
    path: DIST,
    filename: "bundle.js"
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: "babel-loader"
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"]
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        loader: "file-loader",
        options: {
          outputPath: "assets"
        }
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        use: "file-loader"
      }
    ]
  },
  plugins: [
    new HtmlPlugin({
      template: "index.html"
    }),
    new CopyPlugin([
      {
        from: "./assets/*",
        to: DIST
      }
    ])
  ],
  devServer: {
    contentBase: DIST,
    compress: true,
    port: 9000
  }
};
