const fs = require('fs');
const path = require('path');

// Create a simple HTML file to convert SVG to PNG
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>SVG to PNG Converter</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            padding: 20px; 
            background: #f0f0f0;
        }
        .container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: white; 
            padding: 30px; 
            border-radius: 10px; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .logo-preview { 
            text-align: center; 
            margin: 20px 0; 
            padding: 20px; 
            background: #3AAFA9; 
            border-radius: 10px;
        }
        button { 
            background: #3AAFA9; 
            color: white; 
            border: none; 
            padding: 15px 30px; 
            border-radius: 5px; 
            cursor: pointer; 
            font-size: 16px; 
            margin: 10px;
        }
        button:hover { background: #2B7A78; }
        .instructions {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>DocConnect Pro - Logo Converter</h1>
        
        <div class="instructions">
            <h3>📱 Required Sizes for Expo App:</h3>
            <ul>
                <li><strong>App Icon:</strong> 1024x1024px (icon.png)</li>
                <li><strong>Adaptive Icon:</strong> 1024x1024px (adaptive-icon.png)</li> 
                <li><strong>Splash Screen:</strong> 512x512px (splash-icon.png)</li>
                <li><strong>Favicon:</strong> 48x48px (favicon.png)</li>
            </ul>
        </div>

        <!-- Splash Logo Preview -->
        <div class="logo-preview">
            <h3 style="color: white;">Splash Screen Logo</h3>
            <svg id="splashLogo" width="300" height="300" viewBox="0 0 512 512">
                <circle cx="256" cy="256" r="240" fill="white" stroke="#2B7A78" stroke-width="6"/>
                <rect x="230" y="136" width="52" height="240" fill="#3AAFA9" rx="8"/>
                <rect x="136" y="230" width="240" height="52" fill="#3AAFA9" rx="8"/>
                <path d="M170 204 Q155 188 145 204 Q155 220 170 204" fill="#3AAFA9" stroke="#2B7A78" stroke-width="3"/>
                <circle cx="145" cy="204" r="14" fill="none" stroke="#3AAFA9" stroke-width="5"/>
                <path d="M170 204 Q204 170 238 204 Q272 238 306 204 Q340 170 374 204" 
                      fill="none" stroke="#3AAFA9" stroke-width="6" stroke-linecap="round"/>
                <circle cx="374" cy="204" r="20" fill="#3AAFA9" stroke="#2B7A78" stroke-width="3"/>
                <path d="M102 340 L136 340 L153 306 L170 374 L187 272 L204 408 L221 340 L408 340" 
                      fill="none" stroke="#3AAFA9" stroke-width="5" stroke-linecap="round"/>
                <text x="256" y="442" text-anchor="middle" fill="#3AAFA9" font-family="Arial, sans-serif" 
                      font-size="40" font-weight="bold">DocConnect</text>
                <text x="256" y="475" text-anchor="middle" fill="#2B7A78" font-family="Arial, sans-serif" 
                      font-size="28" font-weight="normal">PRO</text>
            </svg>
        </div>
        
        <!-- App Icon Preview -->
        <div class="logo-preview" style="background: linear-gradient(135deg, #3AAFA9, #2B7A78);">
            <h3 style="color: white;">App Icon</h3>
            <svg id="appIcon" width="200" height="200" viewBox="0 0 1024 1024">
                <rect width="1024" height="1024" rx="200" fill="white"/>
                <rect x="460" y="256" width="104" height="512" fill="#3AAFA9" rx="20"/>
                <rect x="256" y="460" width="512" height="104" fill="#3AAFA9" rx="20"/>
                <circle cx="350" cy="400" r="30" fill="none" stroke="#3AAFA9" stroke-width="12"/>
                <path d="M380 400 Q450 350 520 400 Q590 450 660 400" 
                      fill="none" stroke="#3AAFA9" stroke-width="12" stroke-linecap="round"/>
                <circle cx="660" cy="400" r="40" fill="#3AAFA9" stroke="#2B7A78" stroke-width="8"/>
                <path d="M200 700 L280 700 L320 650 L360 750 L400 600 L440 800 L480 700 L800 700" 
                      fill="none" stroke="#3AAFA9" stroke-width="12" stroke-linecap="round"/>
            </svg>
        </div>

        <div style="text-align: center;">
            <button onclick="downloadPNG('splashLogo', 'splash-icon.png', 512)">Download Splash Logo (512x512)</button>
            <button onclick="downloadPNG('appIcon', 'icon.png', 1024)">Download App Icon (1024x1024)</button>
            <button onclick="downloadPNG('appIcon', 'adaptive-icon.png', 1024)">Download Adaptive Icon (1024x1024)</button>
        </div>

        <div class="instructions">
            <h3>🚀 Next Steps:</h3>
            <ol>
                <li>Download all the required PNG files using the buttons above</li>
                <li>Replace the existing files in <code>/assets/images/</code></li>
                <li>Run <code>expo prebuild --clean</code> to regenerate native projects</li>
                <li>Run your app to see the new logo!</li>
            </ol>
        </div>
    </div>

    <script>
        function downloadPNG(svgId, filename, size) {
            const svg = document.getElementById(svgId);
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            
            const data = new XMLSerializer().serializeToString(svg);
            const img = new Image();
            const blob = new Blob([data], {type: 'image/svg+xml'});
            const url = URL.createObjectURL(blob);
            
            img.onload = function() {
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, size, size);
                ctx.drawImage(img, 0, 0, size, size);
                canvas.toBlob(function(blob) {
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = filename;
                    link.click();
                    URL.revokeObjectURL(link.href);
                });
            };
            img.src = url;
        }
    </script>
</body>
</html>
`;

// Write the HTML file
fs.writeFileSync('logo-converter.html', htmlContent);
console.log('✅ Logo converter created! Open logo-converter.html in your browser.');
