import { NETWORK } from "@utils";
import config from 'config';
import { inspect } from 'util';

let wasConfigLogged = false;
function inspectConfig() {
  if (!wasConfigLogged) {
    console.log(inspect(config, false, null, true));
    wasConfigLogged = true;
  }
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(() => resolve(), ms));
}

async function skip(allowed: NETWORK[], current: NETWORK) {
  console.log(`This migration in only for ${allowed.join(', ')}. But now network is ${current}`);
  sleep(3e3);
}

type Criteria = NETWORK | NETWORK[]
type NetworkCriteria = Criteria | { not: Criteria } | undefined;

function isNetworkAllowed(criteria: NetworkCriteria, network: NETWORK): boolean {
  if (!criteria) {
    return true;
  }
  if (Array.isArray(criteria)) {
    return criteria.includes(network);
  }
  if (typeof criteria === 'string') {
    return criteria === network;
  }
  if (typeof criteria === 'object') {
    return !isNetworkAllowed(criteria.not, network);
  }
  return false;
}

export function migrationFactory(migration: Migration, criteria?: NetworkCriteria) {
  return async function (_deployer, _network: NETWORK, _accounts) {
    inspectConfig();
    if (!isNetworkAllowed(criteria, _network)) {
      console.log(`This migration in only for ${criteria}. But now network is ${_network}`);
      sleep(3e3);
      return;
    }
    await migration(_deployer, _network, _accounts);
  } as Migration;
}
