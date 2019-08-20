import { AccountVideoRateModel } from '@server/models/account/account-video-rate'
import { PickWith } from '@server/typings/utils'
import { MAccountAudience, MAccountUrl, MVideo } from '..'

type Use<K extends keyof AccountVideoRateModel, M> = PickWith<AccountVideoRateModel, K, M>

// ############################################################################

export type MAccountVideoRate = Omit<AccountVideoRateModel, 'Video' | 'Account'>

export type MAccountVideoRateAccountUrl = MAccountVideoRate &
  Use<'Account', MAccountUrl>

export type MAccountVideoRateAccountVideo = MAccountVideoRate &
  Use<'Account', MAccountAudience> &
  Use<'Video', MVideo>
