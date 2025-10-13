//file: api/express-rest-api/src/utils/qrGenerator.js
const QRCode = require('qrcode');

const generateQRCode = async (data) => {
    try {
        const qrCodeDataUrl = await QRCode.toDataURL(data);
        return qrCodeDataUrl;
    } catch (error) {
        throw new Error('Error generating QR code: ' + error.message);
    }
};

module.exports = {
    generateQRCode,
};