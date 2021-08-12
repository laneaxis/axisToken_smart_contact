import { setAccounts } from "../utils";

contract('Order', (accounts) => {
  setAccounts(accounts);
  require('./constructor.test');
});
