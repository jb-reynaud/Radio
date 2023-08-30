import readline from 'readline'
import chalk from 'chalk'
import { spawn } from 'child_process'

const radioStations = [
    { shortcut: 'c', name: '🇨🇭 Couleur 3', url: 'http://stream.srg-ssr.ch/m/couleur3/mp3_128' },
    { shortcut: 'i', name: '🇫🇷 France Info', url: 'http://icecast.radiofrance.fr/franceinfo-hifi.aac' },
    { shortcut: 'j', name: '🇫🇷 Jazz Radio', url: 'http://jazzradio.ice.infomaniak.ch/jazzradio-high.mp3' },
    { shortcut: 'n', name: '🇫🇷 Radio Nova', url: 'http://radionova.ice.infomaniak.ch/radionova-256.aac' },
    { shortcut: 'w', name: '🇨🇴 La W', url: 'https://24273.live.streamtheworld.com/WRADIOAAC.aac' },
]

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

const playRadio = async stationUrl => {
    const ffplayProcess = spawn('ffplay', ['-nodisp', '-i', stationUrl])

    ffplayProcess.on('close', () => {
        console.log(chalk.green('Radio playback ended.'))
        rl.close()
    })
}

const getMetadata = async stationUrl => {
    const ffprobeProcess = spawn('ffprobe', ['-v', 'quiet', '-print_format', 'json', '-show_format', '-show_streams', stationUrl])
    let metadataChunks = []

    ffprobeProcess.stdout.on('data', data => {
        metadataChunks.push(data)
    })

    ffprobeProcess.on('close', () => {
        try {
            const jsonData = Buffer.concat(metadataChunks).toString()
            const metadata = JSON.parse(jsonData)

            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
            process.stdout.write('🎵 ' + metadata.format.tags.StreamTitle ?? 'Unknown' + '\r')
        } catch (error) {
            console.error('Error parsing JSON:', error)
        }
    })
}

console.log(chalk.yellow('Available radio stations:'))
radioStations.forEach(station => {
    console.log(`${chalk.blue(station.shortcut)}. ${station.name}`)
})

rl.question(chalk.cyan('Enter the shortcut of the radio station you want to listen to: '), async answer => {
    const selectedStation = radioStations.find(station => station.shortcut === answer)

    if (selectedStation) {
        console.log(chalk.green(`Now playing ${selectedStation.name}`))
        await playRadio(selectedStation.url)

        // Print metadata every 5 seconds.
        await getMetadata(selectedStation.url)
        setInterval(async () => {
            await getMetadata(selectedStation.url)
        }, 5_000)
    } else {
        console.log(chalk.red('Invalid station shortcut.'))
        rl.close()
    }
})
