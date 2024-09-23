# Notes around the easy pong experiment

## 1. `<meta charset="UTF-8">`

This **meta tag** specifies the character encoding for the HTML document. **UTF-8** is the most widely used character encoding and supports a large range of characters, including almost all characters from all languages. Without this declaration, the browser may default to another encoding (e.g., ISO-8859-1), which could cause issues with special characters, especially in non-English languages.

## 2. `<meta name="viewport" content="width=device-width, initial-scale=1.0">`

This **meta tag** is essential for making your website responsive, especially on mobile devices. It controls how the webpage is displayed and scaled on different devices, particularly mobile devices.

- **`name="viewport"`**: This tells the browser that the tag contains instructions related to the viewport (i.e., the visible area of the webpage).

Other possible values for `name` in meta tags include `description` (for search engine descriptions), `keywords` (relevant keywords), `author` (webpage author), `robots` (search engine indexing instructions), `theme-color` (browser address bar color), and Open Graph tags like `og:title` (for social media optimization). Each serves a different purpose from `viewport` but helps enhance features like SEO, social sharing, and appearance.

- **`content="width=device-width"`**: This ensures that the **width** of the webpage matches the **width of the device** (e.g., phone, tablet, desktop). Without this, mobile browsers often scale the page to a default width, which can cause layout issues.

- **`initial-scale=1.0"`**: This sets the **initial zoom level** of the page. A value of `1.0` means the page will be displayed at **100% zoom** (i.e., no scaling) when the page is first loaded.
