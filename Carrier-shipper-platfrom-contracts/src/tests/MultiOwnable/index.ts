import { constructorTest } from './constructor.test';
import { addOwnersTest } from './add-owners.test';
import { removeOwnersTest } from './remove-owners.test';
import { CreateInstance, GetAccounts } from './types';


export function multiOwnableTest(
  createInstance: CreateInstance,
  getAccounts: GetAccounts,
): Mocha.Suite {
  return describe('Abstract: MultiOwnable', () => {
    constructorTest(createInstance, getAccounts);
    addOwnersTest(createInstance, getAccounts);
    removeOwnersTest(createInstance, getAccounts);
  });
}
