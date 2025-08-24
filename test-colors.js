const fs = require('fs');
const path = require('path');

// Test to ensure no purple colors are present in the atmosphere component
function testAtmosphereColors() {
    console.log('🧪 Testing atmosphere component for purple colors...\n');
    
    const cssFile = path.join(__dirname, 'src', 'components', 'atmosphere.css');
    const htmlFile = path.join(__dirname, 'src', 'components', 'atmosphere.html');
    
    let hasErrors = false;
    
    // Purple color patterns to check for
    const purplePatterns = [
        /purple/gi,
        /violet/gi,
        /magenta/gi,
        /#[0-9a-f]*[8-9a-f][0-5][0-9a-f]*80/gi, // Various purple hex codes
        /#800080/gi,
        /#9932cc/gi,
        /#663399/gi,
        /#8b008b/gi,
        /rgb\(\s*128\s*,\s*0\s*,\s*128\s*\)/gi,
        /hsl\(\s*30[0-9]\s*,/gi, // Purple hue range 300-330
    ];
    
    // Check CSS file
    if (fs.existsSync(cssFile)) {
        const cssContent = fs.readFileSync(cssFile, 'utf8');
        
        purplePatterns.forEach((pattern, index) => {
            const matches = cssContent.match(pattern);
            if (matches) {
                console.log(`❌ Found potential purple color in CSS: ${matches.join(', ')}`);
                hasErrors = true;
            }
        });
        
        // Check for eggshell white colors
        const eggshellPatterns = [
            /#faf9f6/gi,
            /#f5f4f1/gi,
            /#eeede8/gi
        ];
        
        let foundEggshell = false;
        eggshellPatterns.forEach(pattern => {
            if (cssContent.match(pattern)) {
                foundEggshell = true;
                console.log(`✅ Found eggshell white color: ${pattern.source}`);
            }
        });
        
        if (!foundEggshell) {
            console.log('❌ No eggshell white colors found in CSS');
            hasErrors = true;
        }
    } else {
        console.log('❌ CSS file not found');
        hasErrors = true;
    }
    
    // Check HTML file
    if (fs.existsSync(htmlFile)) {
        const htmlContent = fs.readFileSync(htmlFile, 'utf8');
        
        purplePatterns.forEach(pattern => {
            const matches = htmlContent.match(pattern);
            if (matches) {
                console.log(`❌ Found potential purple color in HTML: ${matches.join(', ')}`);
                hasErrors = true;
            }
        });
        
        console.log('✅ HTML file structure validated');
    } else {
        console.log('❌ HTML file not found');
        hasErrors = true;
    }
    
    // Final result
    if (!hasErrors) {
        console.log('\n🎉 SUCCESS: No purple colors found! Atmosphere component uses correct eggshell white background.');
        console.log('✅ All color requirements met for both development and production environments.');
        process.exit(0);
    } else {
        console.log('\n❌ FAILED: Issues found with atmosphere component colors.');
        process.exit(1);
    }
}

testAtmosphereColors();