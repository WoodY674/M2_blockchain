import {run} from "hardhat";

const verifyContract = async (contractAddress: string,  constructorArguments: any[]): Promise<void> => {

    console.log("Verifying contract...");
    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: constructorArguments,
        });

        console.log("Contract verified!");
    } catch (err) {
        console.error("Verification failed:", err);
    }
};

export { verifyContract };