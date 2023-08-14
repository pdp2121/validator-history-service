import { Router as createRouter } from 'express'

import handleAmendmentsInfo from './amendments'
import handleDailyScores from './daily-report'
import getNetworkOrAdd from './get-network'
import handleHealth from './health'
import handleValidatorManifest from './manifests'
import { handleNode, handleNodes, handleTopology } from './nodes'
import { handleValidator, handleValidators } from './validator'
// eslint-disable-next-line import/max-dependencies -- Disabled since this module requires multiple dependencies.
import handleValidatorReport from './validator-report'

const api = createRouter()

api.use('/health', handleHealth)
api.use('/network/validator_reports', handleDailyScores)
api.use('/network/amendments/info', handleAmendmentsInfo)

api.use('/network/get_network/:entryUrl', getNetworkOrAdd)

api.use('/network/topology/nodes/:network', handleNodes)
api.use('/network/topology/nodes', handleNodes)
api.use('/network/topology/node/:publicKey', handleNode)
api.use('/network/topology', handleTopology)

api.use('/network/validator/:publicKey/reports', handleValidatorReport)
api.use('/network/validator/:publicKey/manifests', handleValidatorManifest)
api.use('/network/validator/:publicKey', handleValidator)
api.use('/network/validators/:param', handleValidators)
api.use('/network/validators', handleValidators)

export default api
