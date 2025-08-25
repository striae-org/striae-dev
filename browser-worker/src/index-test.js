/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

/** Browser URL Renderings
import puppeteer from "@cloudflare/puppeteer";

export default {
  async fetch(request, env) {
    const { searchParams } = new URL(request.url);
    let url = searchParams.get("url");
    let img;
    if (url) {
      url = new URL(url).toString(); // normalize
      img = await env.BROWSER_KV_DEMO.get(url, { type: "arrayBuffer" });
      if (img === null) {
        const browser = await puppeteer.launch(env.MYBROWSER);
        const page = await browser.newPage();
        await page.goto(url);
        img = await page.screenshot();
        await env.BROWSER_KV_DEMO.put(url, img, {
          expirationTtl: 60 * 60 * 24,
        });
        await browser.close();
      }
      return new Response(img, {
        headers: {
          "content-type": "image/jpeg",
        },
      });
    } else {
      return new Response("Please add an ?url=https://example.com/ parameter");
    }
  },
};
*/

// HTML/CSS Generation and Rendering
import puppeteer from "@cloudflare/puppeteer";

const generateDocument = (name) => {
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <style>
      html,
      body,
      #container {
        width: 100%;
        height: 100%;
        margin: 0;
      }
      body {
        font-family: Baskerville, Georgia, Times, serif;
        background-color: #f7f1dc;
      }
      strong {
        color: #5c594f;
        font-size: 128px;
        margin: 32px 0 48px 0;
      }
      em {
        font-size: 24px;
      }
      #container {
        flex-direction: column;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
      }
    </style>
  </head>

  <body>
    <div id="container">
      <em>This is to certify that</em>
      <strong>${name}</strong>
      <em>has rendered a PDF using Cloudflare Workers</em>
    </div>
  </body>
</html>
`;
};

export default {
  async fetch(request, env) {
    const { searchParams } = new URL(request.url);
    let name = searchParams.get("name");

    if (!name) {
      return new Response("Please provide a name using the ?name= parameter");
    }

    const browser = await puppeteer.launch(env.BROWSER);
    const page = await browser.newPage();

    // Step 1: Define HTML and CSS
    const document = generateDocument(name);

    // Step 2: Send HTML and CSS to our browser
    await page.setContent(document);

    // Step 3: Generate and return PDF
	const pdf = await page.pdf({ printBackground: true });

	// Close browser since we no longer need it
    await browser.close();

     return new Response(pdf, {
      headers: {
        "content-type": "application/pdf",
      },
    });
  },
};
