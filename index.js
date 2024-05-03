const axios = require("axios");
const express = require("express");
const EVMaddresses = require("./config");
require("dotenv").config();

const app = express();

const OKLINK_API_KEY = process.env.oklink_api_key;
const baseUrl = "https://www.oklink.com";

const getActiveChains = async (address) => {
  const url =
    "https://www.oklink.com/api/v5/explorer/address/address-active-chain";
  const response = await axios.get(url, {
    params: {
      address: address,
    },
    headers: {
      "Ok-Access-Key": OKLINK_API_KEY,
    },
  });
  return response.data;
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getTokenBalances = async (address, chains, tokenType) => {
  const url = "https://www.oklink.com/api/v5/explorer/address/token-balance";
  const tokenBalances = [];
  for (let i = 0; i < chains.length; i++) {
    const res = await axios.get(url, {
      params: {
        address: address,
        chainShortName: chains[i].chainShortName,
        protocolType: tokenType,
      },
      headers: {
        "Ok-Access-Key": OKLINK_API_KEY,
      },
    });
    await delay(51);
    tokenBalances.push(res?.data?.data[0].tokenList);
  }
  return tokenBalances;
};

const getERC20Details = async (address, chain) => {
  const url = baseUrl + "/api/v5/explorer/token/token-list";
  const response = await axios.get(url, {
    headers: {
      "Ok-Access-Key": OKLINK_API_KEY,
    },
    params: {
      address: address,
      chainShortName: chain,
      protocolType: "token_20",
    },
  });
  const tokensList = response.data.data[0].tokenList;
  return tokensList;
};

const analyzeTransaction = async (address, chain) => {
  const url = baseUrl + "/api/v5/explorer/address/transaction-list";
  const response = await axios.get(url, {
    params: {
      address: address,
      chainShortName: chain,
      limit: 10000,
    },
    headers: {
      "Ok-Access-Key": OKLINK_API_KEY,
    },
  });
  console.log(response.data.data[0].transactionLists);
  const transactionsLists = response.data.data[0].transactionLists;

  let interactions = {};
  transactionsLists.forEach((tx) => {
    const from = tx.from.toLowerCase();
    const to = tx.to.toLowerCase();

    if (from !== address.toLowerCase()) {
      interactions[from] = (interactions[from] || 0) + 1;
    }

    if (to !== address.toLowerCase()) {
      interactions[to] = (interactions[to] || 0) + 1;
    }
  });

  let mostInteractedAddress = "0x";
  let maxInteractions = 0;
  for (const addr in interactions) {
    if (interactions[addr] > maxInteractions) {
      mostInteractedAddress = addr;
      maxInteractions = interactions[addr];
    }
  }
  console.log("most interactedAddress ; ", mostInteractedAddress);
  console.log("max interaction s : ", maxInteractions);
};

const createWebhook = async (address, chainName) => {
  const url =
    baseUrl + "/api/v5/explorer/webhook/create-address-activity-tracker";
  const response = await axios.post(
    url,
    {
      address: address,
      event: "tokenTransfer",
      chainShortName: chainName,
      webhookUrl: "http://localhost:3000/",
    },
    {
      headers: {
        "Ok-Access-Key": OKLINK_API_KEY,
      },
    }
  );
  return response.data;
};

const main = async () => {
  for (i = 0; i < EVMaddresses.length; i++) {
    const activeChains = await getActiveChains(EVMaddresses[i]);
    const chains = activeChains.data;
    console.log(
      "active chains of address :",
      EVMaddresses[i],
      "-----------------------------------",
      chains
    );
    const tokens_20_Balances = await getTokenBalances(
      EVMaddresses[i],
      chains,
      "token_20"
    );
    const tokens_721_Balances = await getTokenBalances(
      EVMaddresses[i],
      chains,
      "token_721"
    );
    const tokens_1155_Balances = await getTokenBalances(
      EVMaddresses[i],
      chains,
      "token_1155"
    );
    console.log(
      "token20_Balances of address",
      EVMaddresses[i],
      "--------------------------------------",
      tokens_20_Balances
    );
    console.log(
      "token721_Balances of address",
      EVMaddresses[i],
      "--------------------------------------",
      tokens_721_Balances
    );
    console.log(
      "token1155_Balances of address",
      EVMaddresses[i],
      "--------------------------------------",
      tokens_1155_Balances
    );
  }
};
main();

// getERC20Details("0xd2dfd8bda951930BfbF4B92912F8C212ac26AB48", "ETH");
// createWebhook("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", "ETH");
// analyzeTransaction("0xd2dfd8bda951930BfbF4B92912F8C212ac26AB48", "ETH");

app.get("/", (req, res) => {
  console.log(req.body);
});

app.listen(3000, () => {
  console.log("listening on port 3000");
});
