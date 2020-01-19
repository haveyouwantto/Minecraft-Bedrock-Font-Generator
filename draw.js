stripDataurl = dataurl => dataurl.substr(dataurl.indexOf(',') + 1);
function parseArguments() {
    try {
        let href = window.location.href.split("?");
        let dict = {};
        let args = href[href.length - 1].split("&");
        for (let i = 0; i < args.length; i++) {
            const element = args[i].split("=");
            dict[element[0]] = element[1];
        }
        return dict;
    }
    catch (e) {
        return null;
    }
}
function manifest(name, resolution) {
    name = name + " (" + resolution + "x)";
    return JSON.stringify({
        format_version: 1,
        header: {
            uuid: uuid(),
            name: name,
            version: [
                0,
                0,
                1
            ],
            description: name + "\nMinecraft Font Pack Generator"
        },
        modules: [
            {
                description: name + "\nMinecraft Font Pack Generator",
                version: [
                    0,
                    0,
                    1
                ],
                uuid: uuid(),
                type: "resources"
            }
        ]
    });
}
function uuid() {
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";

    var uuid = s.join("");
    return uuid;
}
function format(id) {
    let hex = id.toString(16);
    if (hex.length == 1) {
        return "0" + hex.toUpperCase();
    } else return hex.toUpperCase();
}

async function draw(fontname, resolution, fontsize = resolution) {
    let canvas = document.getElementById('glyph');
    let ctx = canvas.getContext("2d");
    let buffer = document.getElementById('buffer');
    let bufferctx = buffer.getContext('2d');

    let zip = new JSZip();
    let fonts = zip.folder("font");

    zip.file('manifest.json', manifest(fontname, resolution));

    canvas.width = resolution * 16;
    canvas.height = resolution * 16;
    buffer.width = resolution;
    buffer.height = resolution;

    bufferctx.font = fontsize + "px " + fontname;
    bufferctx.fillStyle = "#ffffff";

    function drawpage(i) {
        for (let y = 0; y < 16; y++) {
            for (let x = 0; x < 16; x++) {
                let charcode = i * 256 + y * 16 + x;
                let char = String.fromCharCode(charcode);

                bufferctx.clearRect(0, 0, buffer.width, buffer.height);

                bufferctx.fillText(char, 0, resolution - (resolution >> 4) * 2);
                ctx.drawImage(buffer, x * resolution, y * resolution);
            }
        }
    }

    for (let i = 0; i < 0x100; i++) {
        drawpage(i);
        if (i == 0) {
            let base64 = stripDataurl(canvas.toDataURL());
            fonts.file('default8.png', base64, { base64: true });
            fonts.file('ascii_sga.png', base64, { base64: true });
        }
        fonts.file('glyph_' + format(i) + '.png', stripDataurl(canvas.toDataURL()), { base64: true });
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    zip.generateAsync({ type: "blob" })
        .then(function (content) {
            // see FileSaver.js
            saveAs(content, fontname + " (" + resolution + "x).mcpack");
        });
}