// Compiled using marko@4.2.8 - DO NOT EDIT
"use strict";

var marko_template = module.exports = require("marko/html").t(__filename),
    marko_helpers = require("marko/runtime/html/helpers"),
    marko_escapeXml = marko_helpers.x,
    marko_forEach = marko_helpers.f,
    marko_escapeXmlAttr = marko_helpers.xa,
    marko_loadTag = marko_helpers.t,
    init_components_tag = marko_loadTag(require("marko/components/taglib/init-components-tag")),
    await_reorderer_tag = marko_loadTag(require("marko/taglibs/async/await-reorderer-tag"));

function render(input, out) {
  var data = input;

  out.w("<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1, user-scalable=no\"><title>Files within " +
    marko_escapeXml(data.directory) +
    "</title><style>\n    body {\n      background: #fff;\n      margin: 0;\n      padding: 30px;\n      -webkit-font-smoothing: antialiased;\n      font-family: Menlo, Consolas, monospace;\n    }\n\n    main {\n      max-width: 920px;\n    }\n\n    a {\n      color: #1A00F2;\n      text-decoration: none;\n    }\n\n    h1 {\n      font-size: 18px;\n      font-weight: 500;\n      margin-top: 0;\n      color: #000;\n      font-family: -apple-system, Helvetica;\n      display: flex;\n    }\n\n    h1 a {\n      color: inherit;\n      font-weight: bold;\n      border-bottom: 1px dashed transparent;\n    }\n\n    h1 a::after {\n      content: '/';\n    }\n\n    h1 a:hover {\n      color: #7d7d7d;\n    }\n\n    h1 i {\n      font-style: normal;\n    }\n\n    ul {\n      margin: 0;\n      padding: 20px 0 0 0;\n    }\n\n    ul li {\n      list-style: none;\n      padding: 10px 0;\n      font-size: 14px;\n      display: flex;\n      justify-content: space-between;\n    }\n\n    ul li i {\n      color: #9B9B9B;\n      font-size: 11px;\n      display: block;\n      font-style: normal;\n      white-space: nowrap;\n      padding-left: 15px;\n    }\n\n    ul a {\n      color: #1A00F2;\n      white-space: nowrap;\n      overflow: hidden;\n      display: block;\n      text-overflow: ellipsis;\n    }\n\n    /* file-icon – svg inlined here, but it should also be possible to separate out. */\n    ul a::before {\n      content: url(\"data:image/svg+xml; utf8, <svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 64 64'><g><path fill='transparent' stroke='currentColor' stroke-width='4px' stroke-miterlimit='10' d='M50.46,56H13.54V8H35.85a4.38,4.38,0,0,1,3.1,1.28L49.18,19.52a4.38,4.38,0,0,1,1.28,3.1Z'/><polyline fill='transparent' stroke='currentColor' stroke-width='2px' stroke-miterlimit='10' points='35.29 8.31 35.29 23.03 49.35 23.03'/></g></svg>\");\n      display: inline-block;\n      vertical-align: middle;\n      margin-right: 10px;\n    }\n\n    ul a:hover {\n      color: #000;\n    }\n\n    ul a[class=''] + i {\n      display: none;\n    }\n\n    /* folder-icon */\n    ul a[class='']::before {\n      content: url(\"data:image/svg+xml; utf8, <svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 64 64'><path fill='transparent' stroke='currentColor' stroke-width='4px' stroke-miterlimit='10' d='M56,53.71H8.17L8,21.06a2.13,2.13,0,0,1,2.13-2.13h2.33l2.13-4.28A4.78,4.78,0,0,1,18.87,12h9.65a4.78,4.78,0,0,1,4.28,2.65l2.13,4.28H52.29a3.55,3.55,0,0,1,3.55,3.55Z'/></svg>\");\n    }\n\n    @media (min-width: 768px) {\n      ul {\n        display: flex;\n        flex-wrap: wrap;\n      }\n\n      ul li {\n        width: 230px;\n        padding-right: 20px;\n      }\n    }\n\n    @media (min-width: 992px) {\n      body {\n        padding: 45px;\n      }\n\n      h1 {\n        font-size: 15px;\n      }\n\n      ul li {\n        font-size: 13px;\n        box-sizing: border-box;\n        justify-content: flex-start;\n      }\n\n      ul li:hover i {\n        opacity: 1;\n      }\n\n      ul li i {\n        font-size: 10px;\n        opacity: 0;\n        margin-left: 10px;\n        margin-top: 3px;\n        padding-left: 0;\n      }\n    }\n  </style></head><body><main><h1><i>Index of&nbsp;</i>");

  marko_forEach(data.paths, function(path) {
    out.w("<a href=\"" +
      marko_escapeXmlAttr(path.url) +
      "\">" +
      marko_escapeXml(path.name) +
      "</a>");
  });

  out.w("</h1><ul>");

  marko_forEach(data.files, function(file) {
    out.w("<li><a href=\"" +
      marko_escapeXmlAttr(file.relative) +
      "\" class=\"" +
      marko_escapeXmlAttr(file.ext) +
      "\">" +
      marko_escapeXml(file.base) +
      "</a><i>" +
      marko_escapeXml(file.size) +
      "</i></li>");
  });

  out.w("</ul></main><aside><p>Node.js " +
    marko_escapeXml(data.nodeVersion) +
    " <a href=\"https://github.com/trekjs/static\" target=\"_blank\" rel=\"noopener noreferrer\">trek-static</a> running @ localhost</p></aside>");

  init_components_tag({}, out);

  await_reorderer_tag({}, out);

  out.w("</body></html>");
}

marko_template._ = render;

marko_template.meta = {
    tags: [
      "marko/components/taglib/init-components-tag",
      "marko/taglibs/async/await-reorderer-tag"
    ]
  };
