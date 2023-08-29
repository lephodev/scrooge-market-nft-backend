import { ethers } from "ethers";

export const getSigner = async (record) => {
  const { signerMessage, signerToken, address } = record;

  try {
    // Verify the signature and recover the wallet address
    const recoveredAddress = ethers.utils.verifyMessage(
      "Your wallet",
      signerToken
    );

    console.log("recoveredAddress", recoveredAddress);

    if (recoveredAddress === address) {
      return true;
      // Signature is valid, user is authenticated
      //   return res.status(200).json({ message: "Authentication successful" });
    } else {
      return false;
      // Signature is invalid
      //   return res.status(401).json({ message: "Authentication failed" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};
