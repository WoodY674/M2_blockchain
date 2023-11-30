import {loadFixture} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import {ethers} from "hardhat";
import {expect} from "chai";

describe("Counter", function () {
    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.
    async function deployCounter() {
        const count = 0;

        // Contracts are deployed using the first signer/account by default
        const [owner, otherAccount] = await ethers.getSigners();

        const Counter = await ethers.getContractFactory("Counter");
        const counter = await Counter.deploy();

        return {counter, count, owner, otherAccount};
    }

    describe("Operations", function () {

        it("should initialise count at 0", async function () {
            const { counter, count } = await loadFixture(deployCounter);
            expect(0).to.equal(await counter.getCount());
        });

        it("should increment count by 1", async function () {
            const { counter, count } = await loadFixture(deployCounter);

            await counter.increment();
            expect(count +1).to.equal(await counter.getCount());
        });

        it("should decrement count by 1", async function () {
            const { counter, count } = await loadFixture(deployCounter);
            await counter.increment();
            await counter.decrement();
            expect(count).to.equal(await counter.getCount());
        });

        it("should not go in negative", async function () {
            const { counter, count } = await loadFixture(deployCounter);

            await expect(counter.decrement()).to.be.revertedWith('Cannot be negative');
            expect(0).to.equal(await counter.getCount());
        });

        it("should reset count to 0" , async function () {
            const { counter, count } = await loadFixture(deployCounter);
            await counter.increment();
            expect(1).to.equal(await counter.getCount());
            await counter.reset();
            expect(0).to.equal(await counter.getCount());
        });
    });
});