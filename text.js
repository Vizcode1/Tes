const { Telegraf } = require('telegraf');
const { Client } = require('ssh2');
const fs = require('fs').promises;

// Inisialisasi bot Telegram
const bot = new Telegraf(''7187855062:AAE7mTrUJ2WLXJ010_2YHHXRi7wiZ3v5t9E');

// Daftar host VPS dan kredensial SSH
const vpsList = [
    { host: '152.42.230.85', username: 'user1', password: '@Root12a' },
    { host: 'vps2.example.com', username: 'user2', password: 'password2' },
    // tambahkan VPS lainnya di sini
];

// Fungsi untuk upload file ke VPS
async function uploadFileToVPS(vps, filePath) {
    try {
        const conn = new Client();
        await conn.connect({
            host: vps.host,
            username: vps.username,
            password: vps.password,
        });
        const sftp = await conn.sftp();
        const remotePath = `/path/to/upload/${filePath}`;
        const readStream = fs.createReadStream(filePath);
        const writeStream = sftp.createWriteStream(remotePath);
        await new Promise((resolve, reject) => {
            writeStream.on('close', () => {
                resolve();
            });
            writeStream.on('error', (error) => {
                reject(error);
            });
            readStream.pipe(writeStream);
        });
        conn.end();
        return `File ${filePath} berhasil di-upload ke ${vps.host}`;
    } catch (error) {
        throw error;
    }
}

// Command untuk meng-upload file
bot.command('/upload', async (ctx) => {
    if (!ctx.message.document) {
        return ctx.reply('Mohon kirimkan file untuk di-upload.');
    }

    const fileUrl = ctx.message.document.file_id;
    const fileName = ctx.message.document.file_name;

    // Download file dari Telegram
    const fileStream = await ctx.telegram.getFileStream(fileUrl);
    const filePath = `/path/to/temp/${fileName}`;
    await fs.writeFile(filePath, fileStream);

    // Upload file ke setiap VPS
    const uploadPromises = vpsList.map((vps) => uploadFileToVPS(vps, filePath));
    try {
        const uploadResults = await Promise.all(uploadPromises);
        ctx.reply('File berhasil di-upload ke semua VPS yang terkait:\n' + uploadResults.join('\n'));
    } catch (error) {
        ctx.reply('Terjadi kesalahan saat meng-upload file.');
        console.error(error);
    }
});

// Mulai bot
bot.launch();
