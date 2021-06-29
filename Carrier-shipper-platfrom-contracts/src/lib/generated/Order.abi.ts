/* Generated by ts-generator ver. 0.0.8 */
/* tslint:disable */

import { AbiItem } from "web3-utils";
export const Abi = [
  {
    inputs: [
      { internalType: "uint256", name: "id", type: "uint256" },
      { internalType: "address", name: "shipper", type: "address" },
      { internalType: "address", name: "carrier", type: "address" },
      {
        internalType: "contract Controller",
        name: "controller",
        type: "address"
      },
      {
        components: [
          { internalType: "uint256", name: "mantissa", type: "uint256" }
        ],
        internalType: "struct AttoDecimal.Instance",
        name: "fee",
        type: "tuple"
      }
    ],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "id", type: "uint256" },
      {
        indexed: true,
        internalType: "address",
        name: "shipper",
        type: "address"
      },
      {
        indexed: true,
        internalType: "address",
        name: "carrier",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "shipperAmount",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "carrierAmount",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "paymentFeeAmount",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "feeAmount",
        type: "uint256"
      }
    ],
    name: "OrderDistributed",
    type: "event"
  }
] as AbiItem[];
