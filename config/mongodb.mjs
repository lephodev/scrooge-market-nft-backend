import { MongoClient, ServerApiVersion, ObjectId } from "mongodb";
import dotenv from "dotenv";
const envconfig = dotenv.config();
export const uri = process.env.MONGODB_URI;
console.log("uri", uri);
export const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
//export const conn = client.connect;

let _db_affiliates,
  _db_scrooge_data,
  _db_affiliates_successful_actions,
  _db_scrooge_social_share,
  _db_marketplace_chip_transactions,
  _db_marketplace_coupons_merch,
  _db_marketplace_daily_reward_token_claims,
  _db_marketplace_ducky_lucks_chip_claims,
  _db_marketplace_ducky_lucks_prizes,
  _db_marketplace_holder_claim_chips_transactions,
  _db_marketplace_items,
  _db_marketplace_prizes,
  _db_marketplace_crypto_to_gc,
  _db_marketplace_redeem_prize_transactions,
  _db_marketplace_wallet_addresses,
  _db_common_batch_burn_transactions,
  _db_common_burn_requests,
  _db_common_common_totals,
  _db_raffles,
  _db_raffles_draws,
  _db_raffles_entries,
  _db_raffles_users,
  _db_raffles_purchases,
  _db_scrooge_users,
  _db_scrooge_user_kycs,
  _db_scrooge_transaction,
  _db_sharing_hashtags,
  _db_sharing_messages,
  _db_sharing_responses,
  _db_sharing_twitterInfluencers,
  _db_user_details_casino_profile_points,
  _db_ticket_to_token,
  _db_crypto_to_token;

export const connectToDB = async () => {
  const client = await MongoClient.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
  });
  _db_scrooge_users = client.db(process.env.SCROOGE_DB).collection("users");
  _db_scrooge_user_kycs = client
    .db(process.env.SCROOGE_DB)
    .collection("userkycs");
  _db_scrooge_data = client.db("dev-markettt").collection("items");
  _db_scrooge_social_share = client
    .db(process.env.SCROOGE_DB)
    .collection("socialshares");
  _db_scrooge_transaction = client
    .db(process.env.SCROOGE_DB)
    .collection("transactions");
  _db_affiliates = client
    .db(process.env.AFFILIATES_DB)
    .collection("affiliates");
  _db_affiliates_successful_actions = client
    .db(process.env.AFFILIATES_DB)
    .collection("successful-actions");
  _db_marketplace_chip_transactions = client
    .db(process.env.CASINO_NFT_MARKETPLACE_DB)
    .collection("chip_transactions");
  _db_marketplace_coupons_merch = client
    .db(process.env.CASINO_NFT_MARKETPLACE_DB)
    .collection("coupons_merch");
  _db_ticket_to_token = client
    .db(process.env.CASINO_NFT_MARKETPLACE_DB)
    .collection("ticket_to_token");
  _db_crypto_to_token = client
    .db(process.env.CASINO_NFT_MARKETPLACE_DB)
    .collection("crypto_to_token");
  _db_marketplace_daily_reward_token_claims = client
    .db(process.env.CASINO_NFT_MARKETPLACE_DB)
    .collection("daily_reward_token_claims");
  _db_marketplace_ducky_lucks_chip_claims = client
    .db(process.env.CASINO_NFT_MARKETPLACE_DB)
    .collection("ducky_lucks_chip_claims");
  _db_marketplace_ducky_lucks_prizes = client
    .db(process.env.CASINO_NFT_MARKETPLACE_DB)
    .collection("ducky_lucks_prizes");
  _db_marketplace_holder_claim_chips_transactions = client
    .db(process.env.CASINO_NFT_MARKETPLACE_DB)
    .collection("holder_claim_chips_transactions");
  _db_marketplace_items = client
    .db(process.env.CASINO_NFT_MARKETPLACE_DB)
    .collection("items");
  _db_marketplace_prizes = client
    .db(process.env.CASINO_NFT_MARKETPLACE_DB)
    .collection("prizes");
  _db_marketplace_crypto_to_gc = client
    .db(process.env.CASINO_NFT_MARKETPLACE_DB)
    .collection("crypto_to_gc");
  _db_marketplace_redeem_prize_transactions = client
    .db(process.env.CASINO_NFT_MARKETPLACE_DB)
    .collection("redeem_prize_transactions");
  //_db_marketplace_wallet_addresses = client.db("casino-nft-marketplace").collection("wallet_addresses");
  //_db_common_batch_burn_transactions = client.db("common").collection("batch_burn_transactions");
  //_db_common_burn_requests = client.db("common").collection("burn_requests");
  //_db_common_common_totals = client.db("common").collection("common_totals");
  _db_raffles = client.db(process.env.RAFFLES_DB).collection("raffles");
  _db_raffles_draws = client
    .db(process.env.RAFFLES_DB)
    .collection("raffles_draws");
  _db_raffles_entries = client
    .db(process.env.RAFFLES_DB)
    .collection("raffles_entries");
  _db_raffles_users = client
    .db(process.env.RAFFLES_DB)
    .collection("raffles_users");
  _db_raffles_purchases = client
    .db(process.env.RAFFLES_DB)
    .collection("raffles_purchases");
  //_db_sharing_hashtags = client.db("sharing-data").collection("hashtags");
  _db_sharing_messages = client
    .db(process.env.SHARING_DATA_DB)
    .collection("messages");
  //_db_sharing_responses = client.db("sharing-data").collection("responses");
  //_db_sharing_twitterInfluencers = client.db("sharing-data").collection("twitterInfluencers");
  //_db_user_details_casino_profile_points = client.db("user-details").collection("casino_profile_points");
};

export const get_scrooge_usersDB = () => _db_scrooge_users;
export const get_scrooge_user_kycs = () => _db_scrooge_user_kycs;
export const get_scrooge_ticket_to_token = () => _db_ticket_to_token;
// export const get_scrooge_usersData=()=>_db_scrooge_data
export const get_scrooge_socialShare = () => _db_scrooge_social_share;
export const get_scrooge_transactionDB = () => _db_scrooge_transaction;
export const get_affiliatesDB = () => _db_affiliates;
export const get_affiliates_successful_actionsDB = () =>
  _db_affiliates_successful_actions;
export const get_marketplace_chip_transactionsDB = () =>
  _db_marketplace_chip_transactions;
export const get_marketplace_coupons_merchDB = () =>
  _db_marketplace_coupons_merch;
export const get_marketplace_daily_reward_token_claimsDB = () =>
  _db_marketplace_daily_reward_token_claims;
export const get_marketplace_ducky_lucks_chip_claimsDB = () =>
  _db_marketplace_ducky_lucks_chip_claims;
export const get_marketplace_ducky_lucks_prizesDB = () =>
  _db_marketplace_ducky_lucks_prizes;
export const get_marketplace_holder_claim_chips_transactionsDB = () =>
  _db_marketplace_holder_claim_chips_transactions;
export const get_marketplace_itemsDB = () => _db_marketplace_items;
export const get_marketplace_prizesDB = () => _db_marketplace_prizes;
export const get_marketplace_gcPackagesDB = () => _db_marketplace_crypto_to_gc;
export const get_marketplace_crypto_to_token = () => _db_crypto_to_token;
export const get_marketplace_redeem_prize_transactionsDB = () =>
  _db_marketplace_redeem_prize_transactions;
//export const get_marketplace_wallet_addressesDB = () => _db_marketplace_wallet_addresses;
//export const get_common_batch_burn_transactionsDB = () => _db_common_batch_burn_transactions;
//export const get_common_burn_requestsDB = () => _db_common_burn_requests;
//export const get_common_common_totalsDB = () => _db_common_common_totals;
export const get_rafflesDB = () => _db_raffles;
export const get_raffles_drawsDB = () => _db_raffles_draws;
export const get_raffles_entriesDB = () => _db_raffles_entries;
export const get_raffles_usersDB = () => _db_raffles_users;
export const get_raffles_purchasesDB = () => _db_raffles_purchases;
//export const get_sharing_hashtagsDB = () => _db_sharing_hashtags;
export const get_sharing_messagesDB = () => _db_sharing_messages;
//export const get_sharing_responsesDB = () => _db_sharing_responses;
//export const get_sharing_twitterInfluencersDB = () => _db_sharing_twitterInfluencers;
//export const get_user_details_casino_profile_pointsDB = () => _db_user_details_casino_profile_points;

export default connectToDB;

//export default uri;
