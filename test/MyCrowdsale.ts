import { ethers } from "hardhat";
import { expect } from "chai";

import { Signer } from "ethers";
import {IERC20, MyCrowdsale} from "../typechain-types";

describe("MyCrowdsale Contract", function () {
    let crowdsale: MyCrowdsale;
    let token: IERC20;
    let owner: Signer;
    let addr1: Signer;
    let addr2: Signer;
    const goal = ethers.parseEther("100"); // Exemple de goal

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();

        // Deploy the ERC20 Token contract
        const Token = await ethers.getContractFactory("Bite");
        token = (await Token.deploy("10000000000000000000000000")) as IERC20; // 1,000 tokens

        // Deploy the MyCrowdsale contract
        const CrowdsaleContract = await ethers.getContractFactory("MyCrowdsale");
        crowdsale = (await CrowdsaleContract.deploy(token.getAddress(), 3600, ethers.parseEther("100"))) as MyCrowdsale;

        // Transfer some tokens to the MyCrowdsale contract
        await token.transfer(crowdsale.getAddress(), ethers.parseEther("100")); // 500 tokens
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await crowdsale.owner()).to.equal(await owner.getAddress());
        });

        it("Should assign the total supply of tokens to the MyCrowdsale", async function () {
            const crowdsaleBalance = await token.balanceOf(crowdsale.getAddress());
            expect(crowdsaleBalance).to.equal(ethers.parseEther("100"));
        });
    });

    describe("Contributions", function () {
        it("Should accept contributions", async function () {
            // give contributor 10 ether
            const initialTransferAmount = ethers.parseUnits("1", "ether");
            await token.transfer(await addr1.getAddress(), initialTransferAmount);

            // approve the transaction of 1 ether
            const contributionAmount = ethers.parseUnits("1", "ether");
            await token.connect(addr1).approve(crowdsale.getAddress(), contributionAmount);

            //contribute for 1 ether
            await crowdsale.connect(addr1).contribute(contributionAmount);
            const contribution = await crowdsale.contributions(await addr1.getAddress());
            expect(contribution).to.equal(contributionAmount);
        });
    });

    describe("withdraw", function () {
        it("Should allow only owner to withdraw after end and if goal is reached", async function () {
            // Avancer le temps pour que la campagne soit terminée
            await ethers.provider.send("evm_increaseTime", [3600]); // Augmente de 1 heure, ajustez selon votre besoin
            await ethers.provider.send("evm_mine", []);

            // Simuler l'atteinte de l'objectif
            // Note : Cela dépend de la logique de votre contrat, par exemple en faisant des contributions
            // ...

            // Tentative de retrait par le propriétaire
            await expect(crowdsale.connect(owner).withdraw())
                .to.emit(token, "Transfer") // Vérifiez que l'événement Transfer est émis
                .withArgs(await crowdsale.getAddress(), await owner.getAddress(), goal);

            // Vérifiez que le solde du contrat Crowdsale est maintenant 0
            expect(await token.balanceOf(await crowdsale.getAddress())).to.equal(0);
        });

        it("Should fail if non-owner tries to withdraw", async function () {
            await expect(crowdsale.connect(addr1).withdraw()).to.be.revertedWithCustomError(crowdsale, "OwnableUnauthorizedAccount")
        });

        it("Should fail if crowdsale is not ended", async function () {
            // Supposons que la campagne n'est pas encore terminée
            // ...

            await expect(crowdsale.connect(owner).withdraw()).to.be.revertedWith("Crowdsale not ended");
        });
    });

    describe("withdrawUnsoldTokens", function () {
        it("Should allow only owner to withdraw unsold tokens after end", async function () {
            // Avancer le temps pour que la campagne soit terminée
            await ethers.provider.send("evm_increaseTime", [3600]);
            await ethers.provider.send("evm_mine", []);

            const initialOwnerBalance = await token.balanceOf(await owner.getAddress());

            // Retirer les tokens invendus
            await expect(crowdsale.connect(owner).withdrawUnsoldTokens())
                .to.emit(token, "Transfer");

            const finalOwnerBalance = await token.balanceOf(await owner.getAddress());
            const crowdsaleBalance = await token.balanceOf(await crowdsale.getAddress());

            expect(crowdsaleBalance).to.equal(0);
            expect(finalOwnerBalance - initialOwnerBalance).to.equal(ethers.parseUnits("100", "ether"));

        });

        it("Should revert if non-owner tries to withdraw unsold tokens", async function () {
            await expect(crowdsale.connect(addr1).withdrawUnsoldTokens()).to.be.reverted;
        });

        it("Should revert if trying to withdraw unsold tokens before end", async function () {
            await expect(crowdsale.connect(owner).withdrawUnsoldTokens()).to.be.revertedWith("Crowdsale not yet finished");
        });
    });
});