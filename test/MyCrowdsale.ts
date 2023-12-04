import { ethers } from "hardhat";
import { expect } from "chai";

import { Signer } from "ethers";
import {IERC20, MyCrowdsale} from "../typechain-types";

describe("MyCrowdsale Contract", function () {
    let crowdsale: MyCrowdsale;
    let token: IERC20;
    let owner: Signer;
    let contributor: Signer;
    const goal = ethers.parseEther("200");

    beforeEach(async function () {
        [owner, contributor] = await ethers.getSigners();

        // Deploy the ERC20 Token contract
        const Token = await ethers.getContractFactory("Bite");
        token = (await Token.deploy("10000000000000000000000000")) as IERC20;

        // Deploy the MyCrowdsale contract
        const CrowdsaleContract = await ethers.getContractFactory("MyCrowdsale");
        crowdsale = (await CrowdsaleContract.deploy(token.getAddress(), 3600, goal)) as MyCrowdsale;

        // Transfer some tokens to the MyCrowdsale contract
        await token.transfer(crowdsale.getAddress(), ethers.parseEther("100"));

        // give contributor 10 ether
        const initialTransferAmount = ethers.parseEther("10");
        await token.transfer(await contributor.getAddress(), initialTransferAmount);

        // approve the transaction of 1 ether
        const contributionAmount = ethers.parseEther("1");
        await token.connect(contributor).approve(crowdsale.getAddress(), contributionAmount);

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

            const contributionAmount = ethers.parseEther("1");

            //contribute for 1 ether
            await crowdsale.connect(contributor).contribute(contributionAmount);
            const contribution = await crowdsale.contributions(await contributor.getAddress());
            expect(contribution).to.equal(contributionAmount);
        });
    });

    describe("withdraw", function () {
        it("Should allow only owner to withdraw after end and if goal is reached", async function () {
            // go to end of campaign
            await token.transfer(crowdsale.getAddress(), ethers.parseEther("100"));
            await ethers.provider.send("evm_increaseTime", [3600]); // Augmente de 1 heure, ajustez selon votre besoin
            await ethers.provider.send("evm_mine", []);

            // owner withdraws
            await expect(crowdsale.connect(owner).withdraw())
                .to.emit(token, "Transfer") // Vérifiez que l'événement Transfer est émis
                .withArgs(await crowdsale.getAddress(), await owner.getAddress(), goal);

            // exepect campaign balance to be 0
            expect(await token.balanceOf(await crowdsale.getAddress())).to.equal(0);
        });

        it("Should fail if non-owner tries to withdraw", async function () {
            await expect(crowdsale.connect(contributor).withdraw()).to.be.revertedWithCustomError(crowdsale, "OwnableUnauthorizedAccount")
        });

        it("Should fail if crowdsale is not ended", async function () {
            await expect(crowdsale.connect(owner).withdraw()).to.be.revertedWith("Crowdsale not ended");
        });
    });

    describe("withdrawUnsoldTokens", function () {
        it("Should allow only owner to withdraw unsold tokens after end", async function () {

            // go to end of campaign
            await ethers.provider.send("evm_increaseTime", [3600]);
            await ethers.provider.send("evm_mine", []);

            const initialOwnerBalance = await token.balanceOf(await owner.getAddress());

            // Withdraw unsold tokens
            await expect(crowdsale.connect(owner).withdrawUnsoldTokens())
                .to.emit(token, "Transfer");

            const finalOwnerBalance = await token.balanceOf(await owner.getAddress());
            const crowdsaleBalance = await token.balanceOf(await crowdsale.getAddress());

            // exepect balance to be 0 and owner to have unsold tokens
            expect(crowdsaleBalance).to.equal(0);
            expect(finalOwnerBalance - initialOwnerBalance).to.equal(ethers.parseEther("100"));

        });

        it("Should revert if non-owner tries to withdraw unsold tokens", async function () {
            await expect(crowdsale.connect(contributor).withdrawUnsoldTokens()).to.be.reverted;
        });

        it("Should revert if trying to withdraw unsold tokens before end", async function () {
            await expect(crowdsale.connect(owner).withdrawUnsoldTokens()).to.be.revertedWith("Crowdsale not yet finished");
        });
    });

    describe("refund", function () {
        it("Should allow contributors to refund if goal is not reached", async function () {

            // Contribute to campaign
            const contributionAmount = ethers.parseEther("1");
            await crowdsale.connect(contributor).contribute(contributionAmount);

            // go to end of campaign
            await ethers.provider.send("evm_increaseTime", [3600]);
            await ethers.provider.send("evm_mine", []);

            // refund
            const initialContributorBalance = await token.balanceOf(await contributor.getAddress());
            await crowdsale.connect(contributor).refund();

            const finalContributorBalance = await token.balanceOf(await contributor.getAddress());

            // expect contributor to be refunded if goal is not reached
            expect(finalContributorBalance).to.equal(initialContributorBalance + contributionAmount);
        });

        it("Should fail to refund if goal is reached", async function () {
            // reach goal
            await token.transfer(crowdsale.getAddress(), ethers.parseEther("100"));

            // go to end of campaign
            await ethers.provider.send("evm_increaseTime", [3600]);
            await ethers.provider.send("evm_mine", []);

            // expect to fail refund because goal is reached
            await expect(crowdsale.connect(contributor).refund()).to.be.revertedWith("Goal reached");
        });

        it("Should fail to refund if crowdfunding is not ended", async function () {
            // expect to fail refund because campaign is not ended
            await expect(crowdsale.connect(contributor).refund()).to.be.revertedWith("Crowdfunding not ended");
        });
    });

    describe("Vesting", function () {
        it("Should not allow to withdraw tokens before release time", async function () {
            // Essayer de retirer les tokens avant le releaseTime
            await expect(crowdsale.connect(contributor).withdrawTokens()).to.be.revertedWith("Tokens are still locked");
        });

        it("Should allow to withdraw tokens after release time", async function () {
            const contributionAmount = ethers.parseEther("1");

            //contribute for 1 ether
            await crowdsale.connect(contributor).contribute(contributionAmount);

            await ethers.provider.send("evm_increaseTime", [3600 * 3]);
            await ethers.provider.send("evm_mine", []);

            // Withdraw tokens
            await expect(() => crowdsale.connect(contributor).withdrawTokens()).to.changeTokenBalances(token, [crowdsale, contributor], [-contributionAmount, contributionAmount]);
        });
    });

});