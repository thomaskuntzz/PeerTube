import { logger } from './logger'
import * as WebTorrent from 'webtorrent'
import { remove } from 'fs-extra'
import { CONFIG } from '../initializers'
import { join } from 'path'

function downloadWebTorrentVideo (target: { magnetUri: string, torrentName?: string }, timeout?: number) {
  const id = target.magnetUri || target.torrentName
  let timer

  logger.info('Importing torrent video %s', id)

  return new Promise<string>((res, rej) => {
    const webtorrent = new WebTorrent()
    let file: WebTorrent.TorrentFile

    const torrentId = target.magnetUri || join(CONFIG.STORAGE.TORRENTS_DIR, target.torrentName)

    const options = { path: CONFIG.STORAGE.VIDEOS_DIR }
    const torrent = webtorrent.add(torrentId, options, torrent => {
      if (torrent.files.length !== 1) {
        if (timer) clearTimeout(timer)

        return safeWebtorrentDestroy(webtorrent, torrentId, file.name, target.torrentName)
          .then(() => rej(new Error('Cannot import torrent ' + torrentId + ': there are multiple files in it')))
      }

      torrent.on('done', () => {
        // FIXME: Dirty fix, we need to wait the FS sync but webtorrent does not provide such method
        setTimeout(() => res(join(CONFIG.STORAGE.VIDEOS_DIR, torrent.files[ 0 ].name)), 1000)
      })
    })

    torrent.on('error', err => rej(err))

    if (timeout) {
      timer = setTimeout(async () => {
        return safeWebtorrentDestroy(webtorrent, torrentId, file ? file.name : undefined, target.torrentName)
          .then(() => rej(new Error('Webtorrent download timeout.')))
      }, timeout)
    }
  })
}

// ---------------------------------------------------------------------------

export {
  downloadWebTorrentVideo
}

// ---------------------------------------------------------------------------

function safeWebtorrentDestroy (webtorrent: WebTorrent.Instance, torrentId: string, filename?: string, torrentName?: string) {
  return new Promise(res => {
    webtorrent.destroy(err => {
      // Delete torrent file
      if (torrentName) {
        remove(torrentId)
          .catch(err => logger.error('Cannot remove torrent %s in webtorrent download.', torrentId, { err }))
      }

      // Delete downloaded file
      if (filename) {
        remove(join(CONFIG.STORAGE.VIDEOS_DIR, filename))
          .catch(err => logger.error('Cannot remove torrent file %s in webtorrent download.', filename, { err }))
      }

      if (err) {
        logger.warn('Cannot destroy webtorrent in timeout.', { err })
      }

      return res()
    })
  })
}
