import puppeteer from "@cloudflare/puppeteer";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const generateDocument = (data) => {
  const { imageUrl, filename, company, firstName, annotationData, activeAnnotations } = data;
  const annotationsSet = new Set(activeAnnotations);
  
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <style>
      html, body {
        width: 100%;
        margin: 0;
        font-family: Arial, sans-serif;
        background-color: white;
      }
      .header {
        text-align: center;
        margin-bottom: 20px;
        border-bottom: 2px solid #333;
        padding-bottom: 10px;
      }
      .image-container {
        text-align: center;
        margin: 20px 0;
      }
      .image-container img {
        max-width: 100%;
        max-height: 500px;
      }
      .annotations {
        margin: 20px 0;
        padding: 10px;
        border: 1px solid #ccc;
      }
      .annotation-item {
        margin: 5px 0;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>Striae Analysis Report</h1>
      ${company ? `<p>Company: ${company}</p>` : ''}
      ${firstName ? `<p>Analyst: ${firstName}</p>` : ''}
      ${filename ? `<p>Image: ${filename}</p>` : ''}
    </div>
    
    ${imageUrl && imageUrl !== '/clear.jpg' ? `
    <div class="image-container">
      <img src="${imageUrl}" alt="Analysis Image" />
    </div>
    ` : ''}
    
    ${annotationData && annotationsSet?.size > 0 ? `
    <div class="annotations">
      <h3>Analysis Data</h3>
      ${annotationsSet.has('class') ? `
        <div class="annotation-item">
          <strong>Class Type:</strong> ${annotationData.classType}
          ${annotationData.customClass ? ` - ${annotationData.customClass}` : ''}
        </div>
        <div class="annotation-item">
          <strong>Class Note:</strong> ${annotationData.classNote}
        </div>
      ` : ''}
      
      ${annotationsSet.has('id') ? `
        <div class="annotation-item">
          <strong>Left Case:</strong> ${annotationData.leftCase}
        </div>
        <div class="annotation-item">
          <strong>Right Case:</strong> ${annotationData.rightCase}
        </div>
        <div class="annotation-item">
          <strong>Support Level:</strong> ${annotationData.supportLevel}
        </div>
      ` : ''}
      
      ${annotationData.additionalNotes ? `
        <div class="annotation-item">
          <strong>Additional Notes:</strong> ${annotationData.additionalNotes}
        </div>
      ` : ''}
    </div>
    ` : ''}
  </body>
</html>
`;
};

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method === 'POST') {
      try {
        const data = await request.json();
        
        const browser = await puppeteer.launch(env.BROWSER);
        const page = await browser.newPage();

        // Generate HTML document with canvas data
        const document = generateDocument(data);
        await page.setContent(document);

        // Generate PDF
        const pdf = await page.pdf({ 
          printBackground: true,
          format: 'letter',
          margin: { top: '1in', bottom: '1in', left: '1in', right: '1in' }
        });

        await browser.close();

        return new Response(pdf, {
          headers: {
            ...corsHeaders,
            "content-type": "application/pdf",
            "content-disposition": `attachment; filename="striae-report-${Date.now()}.pdf"`
          },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "content-type": "application/json" }
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, "content-type": "application/json" }
    });
  },
};