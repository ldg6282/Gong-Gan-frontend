const newHTML = `
  <!doctype html>
  <html lang="ko">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Gong-Gan</title>
      <link rel="stylesheet" href="${chrome.runtime.getURL("assets/index.css")}" />
      <link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
    </head>
    <body>
      <div id="GONG-GAN-ROOT"></div>
      <script type="module" src="${chrome.runtime.getURL("index.js")}"></script>
    </body>
  </html>
`;

document.open();
document.write(newHTML);
document.close();
