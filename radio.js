import readline from 'readline';
import axios from 'axios';
import chalk from 'chalk';
import { spawn } from 'child_process';

const radioStations = [
    { shortcut: 'c', name: '🇨🇭 Couleur 3', url: 'http://stream.srg-ssr.ch/m/couleur3/mp3_128' },
    { shortcut: 'i', name: '🇫🇷 France Info', url: 'http://icecast.radiofrance.fr/franceinfo-hifi.aac' },
    { shortcut: 'n', name: '🇫🇷 Radio Nova', url: 'http://radionova.ice.infomaniak.ch/radionova-256.aac' },
    { shortcut: 'w', name: '🇨🇴 La W', url: 'https://24273.live.streamtheworld.com/WRADIOAAC.aac' },
];

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const playRadio = async stationUrl => {
    try {
        const response = await axios.get(stationUrl, { responseType: 'stream' });

        const ffplayProcess = spawn('ffplay', ['-nodisp', '-i', 'pipe:0']);

        response.data.pipe(ffplayProcess.stdin);

        ffplayProcess.on('close', () => {
            console.log(chalk.green('Radio playback ended.'));
            rl.close();
        });
    } catch (error) {
        console.error(chalk.red('Error while fetching radio stream:'), error);
        rl.close();
    }
};

console.log(chalk.yellow('Available radio stations:'));
radioStations.forEach(station => {
    console.log(`${chalk.blue(station.shortcut)}. ${station.name}`);
});

rl.question(chalk.cyan('Enter the shortcut of the radio station you want to listen to: '), async answer => {
    const selectedStation = radioStations.find(station => station.shortcut === answer);

    if (selectedStation) {
        console.log(chalk.green(`Now playing ${selectedStation.name}`));
        await playRadio(selectedStation.url);
    } else {
        console.log(chalk.red('Invalid station shortcut.'));
        rl.close();
    }
});
