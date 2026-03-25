import { registerConnector } from './base'
import { metaAdsConnector } from './meta-ads'
import { googleAdsConnector } from './google-ads'
import { ninetyNineAcresConnector } from './99acres'
import { magicBricksConnector, housingConnector, justDialConnector } from './generic'

// Register all connectors
registerConnector(metaAdsConnector)
registerConnector(googleAdsConnector)
registerConnector(ninetyNineAcresConnector)
registerConnector(magicBricksConnector)
registerConnector(housingConnector)
registerConnector(justDialConnector)

export { getConnector, getAllConnectors } from './base'
export { metaAdsConnector } from './meta-ads'
export { googleAdsConnector } from './google-ads'
export { ninetyNineAcresConnector } from './99acres'
export { magicBricksConnector, housingConnector, justDialConnector } from './generic'
