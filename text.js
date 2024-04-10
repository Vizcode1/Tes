const { Telegraf } = require('telegraf');
const { Client } = require('ssh2');
const fs = require('fs');

// Inisialisasi bot Telegram
const bot = new Telegraf('YOUR_TELEGRAM_BOT_TOKEN');

// Daftar host VPS dan kredensial SSH
const vpsList = [
    { host: 'vps1.example.com', username: 'user1', password: 'password1' },
    { host: 'vps2.example.com', username: 'user2', password: 'password2' },
    // tambahkan VPS lainnya di sini
];

// Fungsi untuk upload file ke VPS
async function uploadFileToVPS(vps, filePath) {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        conn.on('ready', () => {
            conn.sftp((err, sftp) => {
                if (err) {
                    reject(err);
                    return conn.end();
                }
                const remotePath = `/path/to/upload/${filePath}`;
                const readStream = fs.createReadStream(filePath);
                const writeStream = sftp.createWriteStream(remotePath);
                writeStream.on('close', () => {
                    resolve(`File ${filePath} berhasil di-upload ke ${vps.host}`);
                    conn.end();
                });
                writeStream.on('error', (error) => {
                    reject(error);
                    conn.end();
                });
                readStream.pipe(writeStream);
            });
        }).connect({
            host: vps.host,
            username: vps.username,
            password: vps.password,
        });
    });
}

// Command untuk meng-upload file
bot.command('upload', async (ctx) => {
    if (!ctx.message.document) {
        return ctx.reply('Mohon kirimkan file untuk di-upload.');
    }

    const fileUrl = ctx.message.document.file_id;
    const fileName = ctx.message.document.file_name;

    // Download file dari Telegram
    const fileStream = await ctx.telegram.getFileStream(fileUrl);
    const filePath = `/path/to/temp/${fileName}`;
    const writeStream = fs.createWriteStream(filePath);
    fileStream.pipe(writeStream);

    // Upload file ke setiap VPS
    const uploadPromises = vpsList.map((vps) => uploadFileToVPS(vps, filePath));
    try {
        await Promise.all(uploadPromises);
        ctx.reply('File berhasil di-upload ke semua VPS yang terkait.');
    } catch (error) {
        ctx.reply('Terjadi kesalahan saat meng-upload file.');
        console.error(error);
    }
});

// Mulai bot
bot.launch();
