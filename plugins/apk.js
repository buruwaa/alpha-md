const { Alpha, mode, getJson, config } = require('../lib');

Alpha({
	pattern: 'dapk ?(.*)',
	type: "downloader",
	desc: "download applications from aptoid",
	fromMe: mode
}, async (message, match) => {
	match = match || message.reply_message.text;
	if (!match) return await message.reply("*please give me an application name*");
	if (match) {
		match = match
		const res = await getJson(`${config.BASE_URL}api/dowloader/apk?text=${match}&apikey=${config.ALPHA_KEY}`);
		if (!res.status) return await message.reply(`file not found or  apikey limit has been exceeded. Visit ${config.BASE_URL}signup for gettig a new apikey. setvar alpha_key: your apikey`);
		await new Promise(resolve => setTimeout(resolve, 1000));
		await message.sendReply(res.result.icon, { caption: `*Name*: \`${res.result.name}\`\n*Updated*: ${res.result.lastup}\n*Package*: ${res.result.package}\n*Size*: ${res.result.size}` }, 'image');
		await new Promise(resolve => setTimeout(resolve, 1000));
		return await message.send({
			url: res.result.dllink
		}, {
			mimetype: `application/vnd.android.package-archive`,
			fileName: res.result.name + '.apk'
		}, 'document')
	}
});


let listeningForSAPK = false;
let selectedAppInfo = null;

Alpha({
    pattern: 'sapk ?(.*)',
    type: 'search',
    desc: 'search and download  apk files',
    fromMe: mode
}, async (message, match) => {
    match = match || message.reply_message.text;
    if (!match) return await message.reply('*please provide a search query*');
    const res = await getJson(`${config.BASE_URL}api/search/apk?text=${match}&apikey=${config.ALPHA_KEY}`);
    if (!res.status) return await message.reply('No results found.');
    const results = res.result;
    if (results.length === 0) return await message.reply('No results found.');
    let replyMsg = '*Search Results:*\n';
    results.forEach((app, index) => {
        replyMsg += `${index + 1}. ${app.name}\n`;
    });
    replyMsg += '*Reply with the number to download the corresponding APK file.*\n*or use 0 to cancel download*';
    await message.reply(replyMsg);
    listeningForSAPK = true;
    selectedAppInfo = results;
});

Alpha({
    on: 'text',
    fromMe: mode
}, async (message, match) => {
    if (!listeningForSAPK) return;
    if (!message.reply_message?.fromMe || !message.reply_message?.text) return;
	if (!message.reply_message.text.includes('*Reply with the number to download the corresponding APK file.*\n*or use 0 to cancel download*')) return;
    if (selectedAppInfo && selectedAppInfo.length > 0 && !isNaN(parseInt(message.body))) {
        const selection = parseInt(message.body)
        if (selection === 0) { 
            await message.reply("*Download canceled.*");
            listeningForSAPK = false;
        } else 	if (selection >= 1 && selection <= selectedAppInfo.length) {
            const selectedApp = selectedAppInfo[selection - 1];
            const downloadRes = await getJson(`${config.BASE_URL}api/dowloader/apk?text=${selectedApp.name}&apikey=${config.ALPHA_KEY}`);
            if (!downloadRes.status) {
                await message.reply(`*Error downloading ${selectedApp.name}: API key limit exceeded.*`);
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
            await message.sendReply(downloadRes.result.icon, {
                caption: `*Name*: \`${selectedApp.name}\`\n*Package*: \`${selectedApp.id}\``
            }, 'image');
            await new Promise(resolve => setTimeout(resolve, 1000));
            await message.send({
                url: downloadRes.result.dllink
            }, {
                mimetype: 'application/vnd.android.package-archive',
                fileName: selectedApp.name + '.apk'
            }, 'document');
            listeningForSAPK = false;
            selectedAppInfo = null;
        } else {
            await message.reply(`*Invalid selection. Please enter a valid number. Please enter a number from 1 to ${selectedAppInfo.length}.*`);
        }
    }
});
