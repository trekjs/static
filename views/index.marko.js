function create(__helpers) {
  var str = __helpers.s,
      empty = __helpers.e,
      notEmpty = __helpers.ne,
      escapeXml = __helpers.x,
      forEach = __helpers.f,
      attr = __helpers.a,
      classAttr = __helpers.ca;

  return function render(data, out) {
    out.w("<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1, user-scalable=no\"><title>Files within " +
      escapeXml(data.directory) +
      "</title><link rel=\"stylesheet\" href=\"//maxcdn.bootstrapcdn.com/font-awesome/4.6.1/css/font-awesome.min.css\"><style>\n    body {\n      background: #fff;\n      margin: 0;\n      padding: 30px;\n      -webkit-font-smoothing: antialiased;\n      font-family: Menlo;\n    }\n    @media (min-width: 992px) {\n      body {\n        padding: 45px;\n      }\n    }\n\n    a {\n      color: #1A00F2;\n      text-decoration: none;\n    }\n\n    h1 {\n      font-size: 18px;\n      font-weight: 500;\n      margin-top: 0;\n      color: #000;\n      font-family: -apple-system, Helvetica;\n      display: flex;\n    }\n    h1 i {\n      font-style: normal;\n    }\n    h1 a {\n      color: inherit;\n      font-weight: bold;\n      border-bottom: 1px dashed transparent;\n    }\n    h1 a:after {\n      content: '/';\n    }\n    h1 a:hover {\n      color: #7d7d7d;\n    }\n    @media (min-width: 992px) {\n      h1 {\n        font-size: 15px;\n      }\n    }\n\n    main {\n      max-width: 920px;\n    }\n\n    ul {\n      margin: 0;\n      padding: 20px 0 0 0;\n    }\n    ul li {\n      list-style: none;\n      padding: 10px 0;\n      font-size: 14px;\n      display: flex;\n      justify-content: space-between;\n    }\n    ul li i {\n      color: #9B9B9B;\n      font-size: 11px;\n      display: block;\n      font-style: normal;\n    }\n    @media (min-width: 768px) {\n      ul li {\n        width: 230px;\n        padding-right: 20px;\n      }\n    }\n    @media (min-width: 992px) {\n      ul li {\n        font-size: 13px;\n        box-sizing: border-box;\n        justify-content: flex-start;\n      }\n      ul li:hover i {\n        opacity: 1;\n      }\n      ul li i {\n        font-size: 10px;\n        opacity: 0;\n        margin-left: 10px;\n        margin-top: 3px;\n      }\n    }\n    ul a {\n      color: #1A00F2;\n      white-space: nowrap;\n      overflow: hidden;\n      display: block;\n    }\n    ul a:before {\n      content: '\\f016';\n      font-family: FontAwesome;\n      display: inline-block;\n      margin-right: 10px;\n      color: #000;\n    }\n    ul a:hover {\n      color: #000;\n    }\n    ul a[class=''] + i {\n      display: none;\n    }\n    ul a[class='']:before {\n      content: '\\f114';\n      font-size: 14px;\n    }\n    @media (min-width: 768px) {\n      ul {\n        display: flex;\n        flex-wrap: wrap;\n      }\n    }\n\n    aside {\n      font-style: italic;\n      color: #4A4A4A;\n      margin-top: 50px;\n    }\n    aside p {\n      font-size: 12px;\n      margin: 0;\n      line-height: 1.5em;\n    }\n    @media (min-width: 992px) {\n      aside {\n        padding-top: 50px;\n      }\n    }\n  </style></head><body><main><h1><i>Index of&nbsp;</i>");

    forEach(data.paths, function(path) {
      out.w("<a" +
        attr("href", path.url) +
        ">" +
        escapeXml(path.name) +
        "</a>");
    });

    out.w("</h1><ul>");

    forEach(data.files, function(file) {
      out.w("<li><a" +
        attr("href", file.relative) +
        classAttr(file.ext) +
        ">" +
        escapeXml(file.base) +
        "</a><i>" +
        escapeXml(file.size) +
        "</i></li>");
    });

    out.w("</ul></main><aside><p>Node.js " +
      escapeXml(data.nodeVersion) +
      " <a href=\"https://github.com/trekjs/static\" target=\"_blank\">trek-static</a> running @ localhost</p></aside></body></html>");
  };
}

(module.exports = require("marko").c(__filename)).c(create);
