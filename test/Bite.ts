import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import { Contract } from "ethers";
import { ethers } from "hardhat"

describe("Token Bite", function () {

    let token: Contract;
    const tokenAmount = 100000;

    beforeEach(async function () {
        const { bite } = await loadFixture(deploy)
        token = bite
    })

    async function deploy() {
        const Bite = await ethers.getContractFactory("Bite")
        const bite = await Bite.deploy(tokenAmount)
        return {bite}
    }

    describe("deploy", function () {
        it("should be named Bite", async function () {
            expect(await token.name()).to.eq("Bite")
        })
        it("should have BITE symbol", async function () {
            expect(await token.symbol()).to.eq("BITE")
        })
        //@todo : depends if we can define the total supply with constructor
        it("should have a total supply of 100,000", async function () {
            expect(await token.totalSupply()).to.eq(
                ethers.parseEther(tokenAmount.toString())
            )
        })
        it("should mint total supply to deployer", async function () {
            const [deployer] = await ethers.getSigners()
            expect(await token.balanceOf(deployer.address)).to.eq(
                ethers.parseEther(tokenAmount.toString())
            )
        })
    })

    describe("transfer", function () {
        const amount = ethers.parseEther((tokenAmount/1000).toString())

        it("should transfer amount", async function () {
            const [from, to] = await ethers.getSigners()
            await expect(token.transfer(to.address, amount)).to.changeTokenBalances(token,
                [from, to],
                [amount * BigInt(-1), amount]
            )
        })
        it("should revert transfer exceeding available amount", async function () {
            const [from, to] = await ethers.getSigners()
            const amountOver = ethers.parseEther((tokenAmount*2).toString())
            await expect(token.transfer(to.address, amountOver)).to.reverted
        })
        it("should revert after second transfer exceeding available amount", async function () {
            const [from, to] = await ethers.getSigners()
            const amountOver = ethers.parseEther((tokenAmount*.75).toString())
            await expect(token.transfer(to.address, amountOver)).to.changeTokenBalances(token,
                [from, to],
                [amountOver * BigInt(-1), amountOver]
            )
            await expect(token.transfer(to.address, amountOver)).to.reverted
        })

        it("should transfer amount from a specific account", async function () {
            const [deployer, account0, account1] = await ethers.getSigners()
            // first we will transfer 100 to account0 (from the deployer)
            await token.transfer(account0.address, amount)
            // next, we need to connect as account0 and approve
            // the approval will allow the deployer to send tokens
            // on behalf of account0
            await token.connect(account0).approve(deployer.address, amount)
            // last, we will use transferFrom to allow the deployer to
            // transfer on behalf of account0
            await expect(token.transferFrom(account0.address, account1.address, amount)).to.changeTokenBalances(token,
                [deployer, account0, account1],
                //[0, amount.mul(-1), amount]
                [0, amount * BigInt(-1), amount]
            )
        })
        it("should fail transfer because account doesn't approve deployer", async function () {
            const [deployer, account0, account1] = await ethers.getSigners()

            // provide enough token for all account to do transfert
            await token.transfer(account0.address, amount)
            await token.transfer(account1.address, amount)

            // only account0 approve deployer for transfert
            await token.connect(account0).approve(deployer.address, amount)

            //account1 doesn't approve deployer for transfert, so should fail
            await expect(token.transferFrom(account1.address, account0.address, amount)).to.reverted
            expect(await token.balanceOf(account0.address)).to.eq(amount)
            expect(await token.balanceOf(account1.address)).to.eq(amount)
        })
    })

    describe("events", function () {
        const amount = ethers.parseEther((tokenAmount/1000).toString())

        it("should emit Transfer event", async function () {
            const [from, to] = await ethers.getSigners()
            await expect(token.transfer(to.address, amount)).to.emit(token, 'Transfer').withArgs(
                from.address, to.address, amount
            )
        })
        it("should emit Approval event", async function () {
            const [owner, spender] = await ethers.getSigners()
            await expect(token.approve(spender.address, amount)).to.emit(token, 'Approval').withArgs(
                owner.address, spender.address, amount
            )
        })
    })
})